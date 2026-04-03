#!/usr/bin/env node
// Update passage for 4/3 蔡伦
const ADMIN_API = 'https://gongzu.pages.dev/api/admin';
const KEY = 'gongzu-admin-402e83c1e2db3dc1';

const passage = `公元105年，东汉皇宫的尚方令蔡伦站在作坊里，看着石臼里的一团烂糊糊发愣。树皮、破麻布、旧渔网、稻草……这些被人扔掉的废物，在水中浸泡了好几天，捶打成浆，现在看起来像一锅稀粥。

"捞起来看看。"蔡伦对工匠说。

工匠用竹帘在浆水中轻轻一捞，提起来，水滴答答地流下。帘子上留下薄薄一层纤维。放到太阳下晾干后——一张纸诞生了。

在这之前，中国人写字用竹简（太重，一车竹简可能只是一篇文章）或丝帛（太贵，普通人用不起）。蔡伦想：能不能找到一种又轻又便宜的东西来写字？

他反复试验不同材料的配比。树皮韧性好但难打碎，麻头纤维长但颜色深，破布来源广但杂质多。他把这些缺点互相弥补——混合搭配，像调配药方一样反复调整比例。

失败了无数次。有时纸太脆一碰就碎，有时太厚写不了字，有时干燥后全是洞。工匠们私下嘀咕："一个太监，捣鼓这些破烂干什么？"

但蔡伦不在乎。他知道，如果成功了，知识就不再是贵族的专属。穷人家的孩子也能读书写字。

终于，经过反复改进，他造出了质地均匀、价格低廉的"蔡侯纸"。汉和帝大加赞赏，下令推广全国。

从此，竹简和丝帛逐渐退出历史。纸沿着丝绸之路传到阿拉伯，再传到欧洲。一千多年后，古登堡发明印刷术时，用的就是纸。没有蔡伦的纸，就没有后来的书籍、报纸、甚至今天的……好吧，今天我们用手机了。但在两千年的人类文明中，纸是知识传播最重要的载体，没有之一。

美国学者麦克·哈特在《影响人类历史进程的100名人排行榜》中，把蔡伦排在第七位——比哥伦布、爱因斯坦、达尔文都高。`;

async function main() {
  // Use the quiz API to update passage directly via D1
  // Since there's no update-passage admin action, we need to add one or use wrangler
  // For now, let's just output the SQL
  const escaped = passage.replace(/'/g, "''");
  console.log(`UPDATE daily_quizzes SET passage = '${escaped}' WHERE id = '0ea9e5d9-48e1-4830-b3ce-24b81304f9e2';`);
}

main();
