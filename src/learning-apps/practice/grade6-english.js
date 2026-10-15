// Verified against the publisher's public PDF, Word lists (I), pp. 92–94.
const vocabulary = [
  ['The lion and the mouse', 'mouse|老鼠;large|大的;strong|强壮的;walk by|走过;wake ... up|叫醒;some day|将来某一天;quietly|安静地;weak|虚弱的;loudly|大声地;let ... go|放开;the next day|第二天;net|网;bite|咬;sharp|尖锐的;sadly|伤心地;just then|就在那时;soon|不久;happily|高兴地;from then on|从那时起;cheer|欢呼;hit|击打;deep|深的;reach|够得着;quickly|迅速地;pour ... into|把……倒入'],
  ['Good habits', 'habit|习惯;never|从不;late|迟的;put ... in order|把……整理有序;finish|完成;tidy|整洁的;bad|坏的;sleepy|困倦的;last night|昨晚;fast|快地;go into|进入;slowly|缓慢地;badly|不好地'],
  ['A healthy diet', 'healthy|健康的;diet|饮食;a little|一点;a few|几个;at a time|一次;cola|可乐;need|需要'],
  ['Road safety', 'road|公路;safety|安全;cross|穿过;safely|安全地;must|必须;zebra crossing|斑马线;safe|安全的;pavement|人行道;look out for|当心;easily|容易地;follow|遵守;rule|规则;stay|保持;light|灯'],
  ['A party', "Children's Day|儿童节;clown|小丑;appear|出现;balloon|气球;begin|开始;put on|上演;end|结束"],
  ['An interesting country', 'country|国家;will|将要;learn|学习;Australia|澳大利亚;find out|查明;magazine|杂志;kangaroo|袋鼠;koala|考拉;sport-lover|运动爱好者;Australian football|澳式橄榄球;exciting|令人兴奋的;Sydney|悉尼;welcome|欢迎;visitor|游客;for example|例如;London|伦敦;Oxford|牛津;like|如同;Big Ben|大本钟;London Eye|伦敦眼;Tower Bridge|塔桥;What do you think?|你觉得呢？;month|月'],
  ['Summer holiday plans', 'summer holiday|暑假;go back to|回到;how long|多久;stay|停留;sound|听起来;Disneyland|迪士尼乐园;Ocean Park|海洋公园;Taipei|台北;photo|照片;travel|旅行;traveller|旅行者;travel around the world|环游世界;different|不同的'],
  ['Our dreams', 'dream|梦想;future|未来;care about|关心;tooth|牙齿;astronaut|宇航员;spaceship|宇宙飞船;football player|足球运动员;World Cup|世界杯;dancer|舞蹈家;pianist|钢琴演奏家;come true|实现;take care of|照顾;scientist|科学家;brave|勇敢的;artist|艺术家;paint|画画'],
];
export const grade6English = vocabulary.map(([title, words], index) => ({
  id:`yilin-2014-6b-u${index+1}`, grade:'六年级', edition:'译林英语（三年级起点，2014年版）', term:'下册', title:`Unit ${index+1} ${title}`,
  source:'译林出版社公开电子教材《英语》六年级下册 Word lists (I)，第92–94页；2026-10-15核对。中文释义为项目简释；省略号短语按词表原形练习。',
  sourceUrl:'https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=be9d413aa2d5e7e3e4608a67d13371de',
  items:words.split(';').map(pair => { const [word,meaning]=pair.split('|'); return {id:`yilin-2014-6b-u${index+1}-${word.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,word,meaning}; }),
}));
