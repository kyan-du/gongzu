#!/usr/bin/env node
// Backfill round 2: story quizzes + English grammar from WeChat history
const API = 'https://gongzu.pages.dev/api/quiz';
const KEY = 'gongzu-admin-402e83c1e2db3dc1';

async function createQuiz(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function choiceQ(stem, choices, correctIdx, explanation, tags, difficulty = 3) {
  return {
    type: 'choice',
    content: { stem, choices },
    answer: { correctIndex: correctIdx },
    explanation,
    tags,
    difficulty,
  };
}

function fillQ(stem, answer, explanation, tags, difficulty = 3) {
  return {
    type: 'fill',
    content: { stem },
    answer: { text: answer },
    explanation,
    tags,
    difficulty,
  };
}

const quizzes = [
  // ========== 名人故事选择题 ==========
  {
    date: '2026-03-29', tag: '阅读理解', title: '名人小故事·阅读理解',
    questions: [
      choiceQ('墨子为什么要连夜赶往楚国？',
        ['他想去拜访老朋友公输班', '他听说楚国有很好的木匠工作机会', '他要阻止楚国用云梯攻打宋国', '他想向楚王学习治国的方法'],
        2, '墨子听说公输班为楚国造了云梯要攻打宋国，连夜赶去阻止战争。', ['名人故事', '墨子'], 3),
      choiceQ('墨子和公输班在楚王面前的"较量"，最能体现墨子的什么品质？',
        ['身体强壮，走路很快', '智慧过人，善于防守', '手工精巧，会做木工', '口才极好，能言善辩'],
        1, '墨子用腰带和木片模拟攻防九次，每次都化解了公输班的进攻。', ['名人故事', '墨子'], 3),
      choiceQ('墨子救了宋国后，却被城门守卫拒之门外淋雨。他为什么不后悔？',
        ['因为他想在雨中锻炼身体', '因为他觉得守卫做得对', '因为他希望楚王能看到他的付出', '因为他做这件事不是为了别人的感激'],
        3, '墨子践行"兼爱非攻"，救人不求回报。', ['名人故事', '墨子'], 3),
    ],
  },
  {
    date: '2026-03-30', tag: '阅读理解', title: '名人小故事·阅读理解',
    questions: [
      choiceQ('王昭君为什么多年见不到皇帝？',
        ['她主动躲避不想见皇帝', '她没有贿赂画师，在美女图册里被画得不好看', '她被分配到偏远的宫殿', '她的家世不够显赫'],
        1, '画师毛延寿故意把不贿赂他的宫女画丑，王昭君因此被埋没。', ['名人故事', '王昭君'], 3),
      choiceQ('王昭君到达草原后做了哪些事情来促进汉匈和平？',
        ['只负责生儿育女维系两族关系', '要求匈奴人全部学习汉语', '学习匈奴生活技能，同时教授中原农耕技术和文化', '写信要求汉朝派遣更多军队保护自己'],
        2, '王昭君主动融入匈奴生活，同时将中原文化和农耕技术带到草原。', ['名人故事', '王昭君'], 3),
      choiceQ('王昭君出塞后，汉匈和平持续了多久？',
        ['六十年', '三十年', '一百年', '十年'],
        0, '王昭君出塞后，汉匈边境保持了约六十年的和平。', ['名人故事', '王昭君'], 2),
    ],
  },
  {
    date: '2026-03-31', tag: '阅读理解', title: '名人小故事·阅读理解',
    questions: [
      choiceQ('张謇在考中状元后做出了怎样的选择？',
        ['立即进京做官，光宗耀祖', '放弃做官，回家乡办实业', '既做官又经商，两不耽误', '出国留学，学习先进技术'],
        1, '张謇考中状元后放弃仕途，回南通办实业救国。', ['名人故事', '张謇'], 2),
      choiceQ('张謇创办大生纱厂的主要原因是什么？',
        ['为了赚更多钱改善家庭生活', '因为当官太辛苦想换个轻松工作', '朝廷要求状元必须办实业', '看到洋货充斥市场，想让中国能自己生产'],
        3, '张謇看到洋纱洋布充斥市场，中国人的钱都流向外国，决心实业救国。', ['名人故事', '张謇'], 3),
      choiceQ('文中"与草木同生，即不与草木同腐"这句话表达的意思最接近：',
        ['人应该像植物一样热爱大自然', '读书人要珍惜生命，注意健康', '人要做有价值的事，才不会白活一场', '植物会腐烂，人的身体却能永存'],
        2, '这句话出自张謇，意思是人生在世要有作为，不能虚度光阴。', ['名人故事', '张謇'], 3),
    ],
  },
  {
    date: '2026-04-01', tag: '阅读理解', title: '名人小故事·阅读理解',
    questions: [
      choiceQ('楚国使臣来找庄子的目的是什么？',
        ['邀请他去楚国讲学', '请他帮忙整理典籍', '聘请他担任楚国宰相', '向他请教治国之道'],
        2, '楚威王派使臣以厚礼聘请庄子为相。', ['名人故事', '庄子'], 2),
      choiceQ('庄子用神龟的故事想要表达什么？',
        ['乌龟是一种神圣的动物', '他更珍惜自由自在的生活', '楚国的供奉方式不对', '死后留名比活着更重要'],
        1, '庄子问：龟宁愿死后骨头被供在庙堂，还是活着在泥里摇尾巴？答案显然是后者。', ['名人故事', '庄子'], 3),
      choiceQ('从故事中可以看出，庄子认为真正的富有是指什么？',
        ['拥有大量的金钱和土地', '获得很高的官职和地位', '被很多人尊敬和供奉', '内心充盈，需求简单'],
        3, '庄子穷到借米吃饭，却拒绝宰相之位——他认为精神自由才是真正的富有。', ['名人故事', '庄子'], 3),
    ],
  },
  {
    date: '2026-04-02', tag: '阅读理解', title: '名人小故事·阅读理解',
    questions: [
      choiceQ('曹雪芹为什么不去"谋个差事"养家，而要坚持写作？',
        ['他觉得教书比做官更轻松', '他想通过写书恢复家族荣耀', '他要把消逝的人和事记录下来，对得起心中的热爱', '他认为写作能赚更多钱'],
        2, '曹雪芹家族败落后，他选择用十年时间记录那些消逝的人和事。', ['名人故事', '曹雪芹'], 3),
      choiceQ('从"批阅十载，增删五次"可以看出曹雪芹具有什么样的品质？',
        ['做事拖延，效率低下', '对作品精益求精，敬畏艺术', '优柔寡断，缺乏自信', '喜欢炫耀自己的辛苦'],
        1, '十年写作、五次大改，体现的是精益求精的工匠精神。', ['名人故事', '曹雪芹'], 2),
      choiceQ('文章结尾说曹雪芹的执着"不是为了名利"。下列哪个例子与这种精神最相似？',
        ['商人为了赚钱，日夜加班研发新产品', '科学家为了获奖，争分夺秒完成实验', '画家住在破屋里，却为了画好一幅画反复修改数年', '学生为了考高分，每天刷题到深夜'],
        2, '画家和曹雪芹一样，不为外在回报，只为内心的热爱和作品的完美。', ['名人故事', '曹雪芹'], 3),
    ],
  },

  // ========== 英语语法 ==========
  {
    date: '2026-04-01', tag: '英语语法每日练习', title: '英语语法 4/1',
    questions: [
      fillQ('We had an ________ (enjoy) time at the party yesterday.', 'enjoyable', 'enjoy → enjoyable（形容词修饰 time）', ['英语语法', '词性变换'], 3),
      fillQ('Please read the instructions ________ (care) before using the machine.', 'carefully', 'care → carefully（副词修饰动词 read）', ['英语语法', '词性变换'], 2),
      fillQ('My classroom is on the ________ (two) floor of the building.', 'second', 'two → second（序数词）', ['英语语法', '词性变换'], 2),
      fillQ('Hard work is the key to ________ (succeed).', 'success', 'succeed → success（名词作介词 to 的宾语）', ['英语语法', '词性变换'], 3),
      fillQ('Remember to take an umbrella. It looks ________ (rain) outside.', 'rainy', 'rain → rainy（形容词作表语）', ['英语语法', '词性变换'], 2),
      fillQ('Cyan does her homework after dinner every day. (改为否定句)\nCyan ________ ________ her homework after dinner every day.',
        "doesn't do", '一般现在时第三人称单数否定：does not do', ['英语语法', '句型转换'], 2),
      fillQ('The students can use the library on weekends. (改为反义疑问句)\nThe students can use the library on weekends, ________ ________?',
        "can't they", '含 can 的句子反义疑问句用 can\'t + 主语', ['英语语法', '句型转换'], 3),
      fillQ('We have a sports meeting twice a year. (对划线部分提问: a sports meeting)\n________ ________ do you have twice a year?',
        'What event', '对"a sports meeting"提问用 What event', ['英语语法', '句型转换'], 3),
      fillQ('The story is interesting. Everyone likes it. (合并为一句)\nThe story is ________ interesting ________ everyone likes it.',
        'so...that', 'so + adj + that 引导结果状语从句', ['英语语法', '句型转换'], 3),
      fillQ('made, her, smile, the good news, happily (连词成句)',
        'The good news made her smile happily.', 'make sb do sth 结构', ['英语语法', '句型转换'], 2),
    ],
  },
  {
    date: '2026-04-02', tag: '英语语法每日练习', title: '英语语法 4/2',
    questions: [
      fillQ('The ________ (five) lesson is about animals.', 'fifth', 'five → fifth（序数词）', ['英语语法', '词性变换'], 2),
      fillQ('We need three ________ (knife) to cut the cake.', 'knives', 'knife → knives（名词复数，-fe 变 -ves）', ['英语语法', '词性变换'], 2),
      fillQ('She can swim very ________ (good).', 'well', 'good → well（副词修饰动词 swim）', ['英语语法', '词性变换'], 2),
      fillQ('Tom has never been to Japan. (改为反义疑问句)', 'has he', '含 never 的句子是否定含义，反义疑问句用肯定形式', ['英语语法', '句型转换'], 3),
      fillQ('My brother is ________ (strong) than me.', 'stronger', '比较级：strong → stronger', ['英语语法', '词性变换'], 2),
      fillQ('They are watching TV now. (改为一般疑问句)', 'Are they watching TV now?', '现在进行时一般疑问句：把 are 提前', ['英语语法', '句型转换'], 2),
      fillQ('The story is very ________ (interest).', 'interesting', 'interest → interesting（形容词，修饰物用 -ing）', ['英语语法', '词性变换'], 2),
      fillQ('She goes to school by bike. (对划线部分提问: by bike)', 'How does she go to school?', '对方式提问用 How', ['英语语法', '句型转换'], 2),
      fillQ('There ________ (be) some milk in the bottle yesterday.', 'was', '不可数名词 milk + yesterday → was', ['英语语法', '词性变换'], 2),
      fillQ('My father stopped ________ (smoke) last year.', 'smoking', 'stop doing sth = 停止做某事', ['英语语法', '词性变换'], 3),
    ],
  },
];

async function main() {
  let success = 0, fail = 0;
  for (const q of quizzes) {
    try {
      const res = await createQuiz({ userId: 'cyan', ...q });
      console.log(`✅ ${q.date} ${q.tag}: ${res.questionCount} questions`);
      success++;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`❌ ${q.date} ${q.tag}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${success} success, ${fail} fail`);
}

main().catch(console.error);
