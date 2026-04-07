-- 更新疆土拓展系统：添加初始场景
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 更新 scenes 表，添加 default 场景并调整其他场景的幸福值要求
-- 先删除旧的场景数据（如果需要）
DELETE FROM scenes WHERE id IN ('huaxia', 'dongying', 'gaoli', 'annan', 'xianluo', 'dashi');

-- 插入新的场景配置
INSERT INTO scenes (id, name, description, unlock_happiness, display_order) VALUES
  ('default', '初始', '朝堂初景，万象更新', 0, 0),
  ('huaxia', '华夏', '中原大地，繁华盛世', 100, 1),
  ('dongying', '东瀛', '东海之滨，樱花之国', 200, 2),
  ('gaoli', '高丽', '半岛之邦，礼仪之国', 350, 3),
  ('annan', '安南', '南国风情，稻香之地', 550, 4),
  ('xianluo', '暹罗', '热带王国，佛教圣地', 800, 5),
  ('dashi', '大食', '沙漠明珠，商贸之都', 1100, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  unlock_happiness = EXCLUDED.unlock_happiness,
  display_order = EXCLUDED.display_order;

-- 2. 更新现有用户的疆土拓展数据
-- 将所有 unlocked_scenes 中的 'huaxia' 替换为 'default'
UPDATE court_members
SET unlocked_scenes = ARRAY['default']
WHERE unlocked_scenes = ARRAY['huaxia'];

-- 如果有用户已经解锁了多个场景，保留其他场景，只替换 huaxia
UPDATE court_members
SET unlocked_scenes = array_replace(unlocked_scenes, 'huaxia', 'default')
WHERE 'huaxia' = ANY(unlocked_scenes) AND array_length(unlocked_scenes, 1) > 1;

-- 3. 更新 current_scene
UPDATE court_members
SET current_scene = 'default'
WHERE current_scene = 'huaxia';

-- 4. 验证更新结果
SELECT 
  id,
  happiness,
  unlocked_scenes,
  current_scene
FROM court_members
LIMIT 10;

-- 更新完成
SELECT 'Territory expansion update completed successfully!' AS status;
