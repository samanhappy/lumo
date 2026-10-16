import { grade6English } from './grade6-english.js';
import { grade6Words } from './grade6-words.js';
import { grade6Poetry } from './grade6-poetry.js';
import { primaryEnglish } from './primary-english.js';
import { primaryWords } from './primary-words.js';
import { primaryPoetry } from './primary-poetry.js';
// Stable IDs preserve learning records when wording is corrected.
export const courses = [
  { id:'english-vocabulary', name:'英语词汇', icon:'Aa', abilities:{recognize:'看词识义',recall:'看义拼词'}, units:[
    { id:'en-school', grade:'三年级', edition:'自编示例', term:'上册', title:'校园用品', source:'项目自编词汇与例句，非教材配套。', items:[
      {id:'en-book',word:'book',meaning:'书',example:'This is my book.'},
      {id:'en-pen',word:'pen',meaning:'钢笔',example:'I have a pen.'},
      {id:'en-bag',word:'bag',meaning:'包',example:'My bag is blue.'},
      {id:'en-ruler',word:'ruler',meaning:'尺子',example:'This ruler is long.'},
      {id:'en-pencil',word:'pencil',meaning:'铅笔',example:'I write with a pencil.'},
    ]},
    { id:'en-routine', grade:'初一', edition:'自编示例', term:'上册', title:'日常生活', source:'项目自编词汇与例句，非教材配套。', items:[
      {id:'en-breakfast',word:'breakfast',meaning:'早餐',example:'I eat breakfast at seven.'},
      {id:'en-library',word:'library',meaning:'图书馆',example:'We read in the library.'},
      {id:'en-homework',word:'homework',meaning:'家庭作业',example:'I do my homework after school.'},
      {id:'en-exercise',word:'exercise',meaning:'锻炼',example:'I exercise every day.'},
      {id:'en-weekend',word:'weekend',meaning:'周末',example:'We play football at the weekend.'},
    ]},
  ]},
  { id:'chinese-words', name:'语文字词', icon:'字', abilities:{recognize:'语境填空',recall:'看拼音写词'}, units:[
    {id:'zh-nature',grade:'三年级',edition:'自编示例',term:'上册',title:'观察自然',source:'项目自编字词与例句，非教材配套。',items:[
      {id:'zh-qingchen',word:'清晨',pinyin:'qīng chén',meaning:'太阳出来前后的一段时间。',example:'____，小鸟在树上唱歌。'},
      {id:'zh-hudie',word:'蝴蝶',pinyin:'hú dié',meaning:'有两对翅膀、常在花间飞舞的昆虫。',example:'一只____在花丛中飞舞。'},
      {id:'zh-guancha',word:'观察',pinyin:'guān chá',meaning:'仔细察看事物或现象。',example:'我们仔细____小蚂蚁搬食物。'},
      {id:'zh-yulu',word:'雨露',pinyin:'yǔ lù',meaning:'雨水和露水。',example:'小草在____的滋润下生长。'},
    ]},
    {id:'zh-study',grade:'初一',edition:'自编示例',term:'上册',title:'学习与成长',source:'项目自编字词与例句，非教材配套。',items:[
      {id:'zh-zhuanzhu',word:'专注',pinyin:'zhuān zhù',meaning:'注意力集中。',example:'他神情____地阅读课文。'},
      {id:'zh-qinmian',word:'勤勉',pinyin:'qín miǎn',meaning:'勤奋努力。',example:'他学习____，从不懈怠。'},
      {id:'zh-qianxun',word:'谦逊',pinyin:'qiān xùn',meaning:'谦虚恭谨。',example:'他取得成绩后依然保持____的态度。'},
      {id:'zh-jianding',word:'坚定',pinyin:'jiān dìng',meaning:'意志坚强，不动摇。',example:'困难没有动摇他____的信念。'},
    ]},
  ]},
  {id:'classical-poetry',name:'古诗词',icon:'诗',abilities:{recognize:'上下句补全',recall:'逐句默写'},units:[
    {id:'poem-jingyesi',grade:'一年级',edition:'古诗选读示例',term:'上册',title:'静夜思',author:'李白',dynasty:'唐',source:'唐·李白《静夜思》，采用“床前明月光”通行文本；年级为示例推荐，非教材配套。',note:'疑：好像。举头：抬头。思：思念。',items:[
      {id:'jingyesi-1',word:'床前明月光',cue:'第一句',meaning:'明亮的月光洒在床前。'},
      {id:'jingyesi-2',word:'疑是地上霜',cue:'床前明月光',meaning:'好像地上结了一层白霜。'},
      {id:'jingyesi-3',word:'举头望明月',cue:'疑是地上霜',meaning:'抬起头望着天上的明月。'},
      {id:'jingyesi-4',word:'低头思故乡',cue:'举头望明月',meaning:'低下头思念自己的故乡。'},
    ]},
    {id:'poem-shanxing',grade:'三年级',edition:'古诗选读示例',term:'上册',title:'山行',author:'杜牧',dynasty:'唐',source:'唐·杜牧《山行》，采用“白云生处有人家”通行文本；年级为示例推荐，非教材配套。',note:'石径：石头小路。坐：因为。红于：比……更红。',items:[
      {id:'shanxing-1',word:'远上寒山石径斜',cue:'第一句',meaning:'沿着弯曲的石头小路走上深秋的山。'},
      {id:'shanxing-2',word:'白云生处有人家',cue:'远上寒山石径斜',meaning:'白云升起的地方有几户人家。'},
      {id:'shanxing-3',word:'停车坐爱枫林晚',cue:'白云生处有人家',meaning:'停下车，是因为喜爱傍晚的枫林。'},
      {id:'shanxing-4',word:'霜叶红于二月花',cue:'停车坐爱枫林晚',meaning:'经霜的枫叶比二月的鲜花还红。'},
    ]},
  ]},
];
courses[0].units.push(...primaryEnglish,...grade6English);
courses[0].notice='已收录译林英语三年级起点旧版三至六年级上下册，共64个单元的词汇表（2012—2014版权版本）；上册来自原教材公开镜像，非出版社直链。一、二年级不属于本套三年级起点教材。未核定为2026新版，请核对学校用书版次。自编示例单独标注。';
courses[1].units.push(...primaryWords,...grade6Words);
courses[1].abilities.recognize='读音选词 / 语境填空';
courses[1].notice='已收录统编语文一至六年级上下册：一年级完整写字表，二至六年级完整词语表（2016—2019年版）。拼音为项目校订，不含词义讲解。未核定为2026修订版，请核对学校用书版次。自编示例单独标注。';
courses[2].units.push(...primaryPoetry,...grade6Poetry);
courses[2].notice='已收录统编语文一至六年级上下册111首古代诗词（2016—2019年版，含园地及诵读、阅读栏目）；不含现代诗、文言文和零散名句。未核定为2026修订版，请核对学校用书版次。自编示例单独标注。';
