import express from 'express';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { secondMeService } from '../services/secondme.service';
import { logger } from '../utils/logger';

const router = express.Router();

// 简单的内存存储用于 state 验证（生产环境应使用 Redis）
const stateStore = new Map<string, { time: number; frontendUrl: string }>();

// 定期清理过期的 state（每小时）
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.time > 300000) { // 5分钟过期
      stateStore.delete(state);
    }
  }
}, 3600000);

/**
 * 发起 SecondMe OAuth2 授权
 */
router.get('/secondme/login', (req, res) => {
  const state = generateRandomState();
  const frontendUrl = req.query.frontend_url || process.env.FRONTEND_URL;
  
  // 将 state 和 frontend_url 一起存储
  stateStore.set(state, { time: Date.now(), frontendUrl: frontendUrl as string });
  
  const params = new URLSearchParams({
    client_id: process.env.SECONDME_CLIENT_ID!,
    redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
    response_type: 'code',
    state,
    scope: 'userinfo chat.write chat.read'
  });
  
  res.redirect(`https://go.second-me.cn/oauth/?${params.toString()}`);
});

/**
 * OAuth2 回调处理
 */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // 验证 state
    if (!state || !stateStore.has(state as string)) {
      logger.error('Invalid state:', state);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }
    
    // 获取存储的数据
    const stateData = stateStore.get(state as string)!;
    const stateTime = stateData.time;
    const frontendUrl = stateData.frontendUrl;
    
    // 检查 state 是否过期（5分钟）
    if (Date.now() - stateTime > 300000) {
      stateStore.delete(state as string);
      return res.redirect(`${frontendUrl}/login?error=state_expired`);
    }
    
    // 删除已使用的 state
    stateStore.delete(state as string);
    
    // 用授权码换取 Access Token
    const tokenParams = {
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
      client_id: process.env.SECONDME_CLIENT_ID!,
      client_secret: process.env.SECONDME_CLIENT_SECRET!
    };
    
    logger.info('Token request params:', {
      ...tokenParams,
      client_secret: '***' + tokenParams.client_secret.slice(-10) // 只显示后10位
    });
    
    const response = await axios.post(
      'https://api.mindverse.com/gate/lab/api/oauth/token/code',
      new URLSearchParams(tokenParams),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    logger.info('Token response:', response.data);
    
    // 检查响应格式
    if (!response.data || response.data.code !== 0) {
      logger.error('Token exchange failed:', response.data);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_failed`);
    }
    
    const { accessToken, refreshToken, expiresIn } = response.data.data;
    
    // 获取用户信息
    logger.info('Fetching user info...');
    const userInfo = await secondMeService.getUserInfo(accessToken);
    
    logger.info('User info:', userInfo);
    
    // 保存或更新用户（注意：SecondMe 返回的是 userId 而不是 id）
    logger.info('Checking for existing user with secondme_id:', userInfo.userId);
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('secondme_id', userInfo.userId)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      logger.error('Error checking existing user:', selectError);
    }
    
    logger.info('Existing user:', existingUser);
    
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      logger.info('Updating existing user:', userId);
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nickname: userInfo.name,
          avatar: userInfo.avatar,
          bio: userInfo.bio
        })
        .eq('id', userId);
      
      if (updateError) {
        logger.error('Error updating user:', updateError);
      } else {
        logger.info('User updated successfully');
      }
    } else {
      logger.info('Creating new user');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          secondme_id: userInfo.userId,
          nickname: userInfo.name,
          avatar: userInfo.avatar,
          bio: userInfo.bio
        })
        .select()
        .single();
      
      if (insertError) {
        logger.error('Error creating user:', insertError);
        throw insertError;
      }
      
      userId = newUser!.id;
      logger.info('New user created with id:', userId);
    }
    
    // 保存 Token（先删除旧的，再插入新的）
    logger.info('Saving token for user:', userId);
    
    // 删除旧的 token
    await supabase
      .from('user_tokens')
      .delete()
      .eq('user_id', userId);
    
    // 插入新的 token
    const { error: tokenError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: Date.now() + expiresIn * 1000
      });
    
    if (tokenError) {
      logger.error('Error saving token:', tokenError);
      throw tokenError;
    }
    
    logger.info('Token saved successfully');
    
    // 重定向到前端
    const redirectUrl = `${frontendUrl}/login?token=${accessToken}&user_id=${userId}`;
    logger.info('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error: any) {
    logger.error('OAuth callback error:', error);
    logger.error('Error response:', error.response?.data);
    logger.error('Error stack:', error.stack);
    
    // 尝试获取 frontendUrl，如果没有则使用默认值
    const state = req.query.state as string;
    const frontendUrl = stateStore.has(state) ? stateStore.get(state)!.frontendUrl : process.env.FRONTEND_URL;
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

/**
 * 刷新 Access Token
 */
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  
  try {
    const tokenData = await secondMeService.refreshToken(refresh_token);
    
    // 更新数据库中的 Token
    await supabase
      .from('user_tokens')
      .update({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expires_at: Date.now() + tokenData.expiresIn * 1000
      })
      .eq('refresh_token', refresh_token);
    
    res.json({
      code: 0,
      data: tokenData
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

/**
 * 获取当前用户信息
 */
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('user_id, users(*)')
      .eq('access_token', token)
      .single();
    
    if (tokenError || !tokenData) {
      logger.error('Token lookup error:', tokenError);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    logger.info('User lookup successful:', tokenData.users);
    
    res.json(tokenData.users);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export default router;
