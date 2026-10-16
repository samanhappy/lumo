// Checked end-of-book inventories; pinyin is stored explicitly, not inferred at runtime.
const lessons = [
  ["a", "上册", 1, "草原", "绿毯|lǜ tǎn;线条|xiàn tiáo;柔美|róu měi;惊叹|jīng tàn;回味|huí wèi;乐趣|lè qù;目的地|mù dì dì;洒脱|sǎ tuō;衣裳|yī shang;彩虹|cǎi hóng;马蹄|mǎ tí;热乎乎|rè hū hū;礼貌|lǐ mào;拘束|jū shù;举杯|jǔ bēi;感人|gǎn rén;会心|huì xīn;微笑|wēi xiào"],
  ["a", "上册", 2, "丁香结", "宅院|zhái yuàn;幽雅|yōu yǎ;伏案|fú àn;浑浊|hún zhuó;笨拙|bèn zhuō;眼帘|yǎn lián;参差|cēn cī;单薄|dān bó;文思|wén sī;梦想|mèng xiǎng;迷蒙|mí méng;模糊|mó hu;花蕾|huā lěi;衣襟|yī jīn;恍然|huǎng rán;愁怨|chóu yuàn;顺心|shùn xīn;平淡|píng dàn"],
  ["a", "上册", 6, "狼牙山五壮士", "日寇|rì kòu;奋战|fèn zhàn;险要|xiǎn yào;手榴弹|shǒu liú dàn;全神贯注|quán shén guàn zhù;悬崖|xuán yá;斩钉截铁|zhǎn dīng jié tiě;热血沸腾|rè xuè fèi téng;攀登|pān dēng;居高临下|jū gāo lín xià;山涧|shān jiàn;粉身碎骨|fěn shēn suì gǔ;雹子|báo zi;屹立|yì lì;眺望|tiào wàng;喜悦|xǐ yuè;壮烈|zhuàng liè;豪迈|háo mài;不屈|bù qū;惊天动地|jīng tiān dòng dì"],
  ["a", "上册", 7, "开国大典", "政府|zhèng fǔ;外宾|wài bīn;汇集|huì jí;预定|yù dìng;爆发|bào fā;排山倒海|pái shān dào hǎi;就位|jiù wèi;宣告|xuān gào;雄伟|xióng wěi;肃静|sù jìng;旗帜|qí zhì;语调|yǔ diào;完毕|wán bì;检阅|jiǎn yuè;制服|zhì fú;坦克|tǎn kè;一致|yī zhì;距离|jù lí;高潮|gāo cháo;次序|cì xù"],
  ["a", "上册", 10, "竹节人", "威风凛凛|wēi fēng lǐn lǐn;疙瘩|gē da;疲倦|pí juàn;呆头呆脑|dāi tóu dāi nǎo;冰棍|bīng gùn;别出心裁|bié chū xīn cái;技高一筹|jì gāo yī chóu;橡皮|xiàng pí;跺脚|duò jiǎo;大步流星|dà bù liú xīng;颓然|tuí rán;暴露无遗|bào lù wú yí;沮丧|jǔ sàng;抽屉|chōu tì;念念有词|niàn niàn yǒu cí;忘乎所以|wàng hū suǒ yǐ;心满意足|xīn mǎn yì zú"],
  ["a", "上册", 11, "宇宙生命之谜", "发达|fā dá;理论|lǐ lùn;类似|lèi sì;猜测|cāi cè;起源|qǐ yuán;适当|shì dāng;氧气|yǎng qì;提供|tí gōng;能源|néng yuán;昼夜|zhòu yè;神秘|shén mì;观测|guān cè;拍摄|pāi shè;斑点|bān diǎn;枯萎|kū wěi;干燥|gān zào;沙漠|shā mò;磁场|cí chǎng;抵御|dǐ yù;因素|yīn sù;考察|kǎo chá;培养|péi yǎng"],
  ["a", "上册", 13, "桥", "咆哮|páo xiào;惊慌|jīng huāng;嗓子|sǎng zi;跌跌撞撞|diē diē zhuàng zhuàng;拥戴|yōng dài;沙哑|shā yǎ;党员|dǎng yuán;呻吟|shēn yín;废话|fèi huà;吞没|tūn mò;猛然|měng rán"],
  ["a", "上册", 14, "穷人", "渔夫|yú fū;汹涌澎湃|xiōng yǒng péng pài;风暴|fēng bào;轰鸣|hōng míng;心惊肉跳|xīn jīng ròu tiào;沉思|chén sī;抱怨|bào yuàn;倾听|qīng tīng;探望|tàn wàng;照顾|zhào gù;困难|kùn nán;阴冷|yīn lěng;自作自受|zì zuò zì shòu;湿淋淋|shī lín lín;渔网|yú wǎng;糟糕|zāo gāo;忧虑|yōu lǜ;后脑勺|hòu nǎo sháo"],
  ["a", "上册", 16, "夏天里的成长", "活生生|huó shēng shēng;苔藓|tái xiǎn;草坪|cǎo píng;甘蔗|gān zhè;瀑布|pù bù;增加|zēng jiā;缝隙|fèng xì;软绵绵|ruǎn mián mián;谚语|yàn yǔ;农作物|nóng zuò wù;尽量|jǐn liàng"],
  ["a", "上册", 17, "盼", "斗篷|dǒu peng;情况|qíng kuàng;袖子|xiù zi;瓦蓝|wǎ lán;衣柜|yī guì;预报|yù bào;喧闹|xuān nào;遮盖|zhē gài;讲座|jiǎng zuò;酱油|jiàng yóu;逗引|dòu yǐn;嘴唇|zuǐ chún;楼梯|lóu tī"],
  ["a", "上册", 19, "只有一个地球", "晶莹|jīng yíng;摇篮|yáo lán;壮观|zhuàng guān;和蔼|hé ǎi;资源|zī yuán;有限|yǒu xiàn;矿产|kuàng chǎn;无私|wú sī;慷慨|kāng kǎi;节制|jié zhì;枯竭|kū jié;贡献|gòng xiàn;毁坏|huǐ huài;滥用|làn yòng;生态|shēng tài;设想|shè xiǎng;例如|lì rú;基地|jī dì;目睹|mù dǔ;子孙|zǐ sūn"],
  ["a", "上册", 23, "月光曲", "谱写|pǔ xiě;钢琴|gāng qín;幽静|yōu jìng;断断续续|duàn duàn xù xù;茅屋|máo wū;烛光|zhú guāng;失明|shī míng;纯熟|chún shú;清幽|qīng yōu;琴键|qín jiàn;景象|jǐng xiàng;陶醉|táo zuì"],
  ["a", "上册", 25, "少年闰土", "一望无际|yī wàng wú jì;家景|jiā jǐng;郑重|zhèng zhòng;供品|gòng pǐn;祭器|jì qì;讲究|jiǎng jiu;盼望|pàn wàng;厨房|chú fáng;毡帽|zhān mào;项圈|xiàng quān;刺猬|cì wei;伶俐|líng lì;经历|jīng lì;潮汛|cháo xùn"],
  ["a", "上册", 26, "好的故事", "预告|yù gào;烟雾|yān wù;昏沉|hūn chén;错综|cuò zōng;澄碧|chéng bì;荡漾|dàng yàng;解散|jiě sàn;退缩|tuì suō;瘦削|shòu xuē;浮动|fú dòng;瞬间|shùn jiān;凝视|níng shì;骤然|zhòu rán;凌乱|líng luàn;陡然|dǒu rán"],
  ["b", "下册", 1, "北京的春节", "热情|rè qíng;自傲|zì ào;饺子|jiǎo zi;万象更新|wàn xiàng gēng xīn;鞭炮|biān pào;眨眼|zhǎ yǎn;通宵|tōng xiāo;间断|jiàn duàn;万不得已|wàn bù dé yǐ;截然|jié rán;燃放|rán fàng;小贩|xiǎo fàn;摆摊儿|bǎi tān ér;彼此|bǐ cǐ;贺年|hè nián;骆驼|luò tuo;恰好|qià hǎo;一律|yī lǜ;彩绘|cǎi huì;分外|fèn wài"],
  ["b", "下册", 2, "腊八粥", "腊八粥|là bā zhōu;感觉|gǎn jué;沸腾|fèi téng;何况|hé kuàng;搅和|jiǎo huo;资格|zī gé;可靠|kě kào;罢了|bà le;要不然|yào bù rán;猜想|cāi xiǎng;肿胀|zhǒng zhàng;惊异|jīng yì;总之|zǒng zhī;染缸|rǎn gāng;解释|jiě shì;筷子|kuài zi;浪漫|làng màn;奈何|nài hé"],
  ["b", "下册", 5, "鲁滨逊漂流记（节选）", "流落|liú luò;凄凉|qī liáng;防御|fáng yù;寂寞|jì mò;宴会|yàn huì;恐惧|kǒng jù;倒霉|dǎo méi;忧伤|yōu shāng;书籍|shū jí;缺乏|quē fá;处境|chǔ jìng;理智|lǐ zhì;控制|kòng zhì;心平气和|xīn píng qì hé;抛弃|pāo qì;重见天日|chóng jiàn tiān rì;侵袭|qīn xí;倾覆|qīng fù;宽慰|kuān wèi;深重|shēn zhòng;困境|kùn jìng;焉知非福|yān zhī fēi fú"],
  ["b", "下册", 8, "匆匆", "确乎|què hū;空虚|kōng xū;不禁|bù jīn;挪移|nuó yí;觉察|jué chá;叹息|tàn xī;徘徊|pái huái;微风|wēi fēng;何曾|hé céng;游丝|yóu sī;赤裸裸|chì luǒ luǒ"],
  ["b", "下册", 9, "那个星期天", "明媚|míng mèi;时光|shí guāng;拨弄|bō nòng;草丛|cǎo cóng;画报|huà bào;翻箱倒柜|fān xiāng dào guì;念叨|niàn dao;停顿|tíng dùn;晃动|huàng dòng;耽搁|dān gē;沉郁|chén yù;漫长|màn cháng;休止|xiū zhǐ;惊惶|jīng huáng;亲吻|qīn wěn;依偎|yī wēi;挽回|wǎn huí;荒凉|huāng liáng"],
  ["b", "下册", 11, "十六年前的回忆", "埋头|mái tóu;幼稚|yòu zhì;含糊|hán hu;避免|bì miǎn;局势|jú shì;严峻|yán jùn;轻易|qīng yì;尖锐|jiān ruì;僻静|pì jìng;魔鬼|mó guǐ;苦刑|kǔ xíng;冷笑|lěng xiào;残暴|cán bào;匪徒|fěi tú;法庭|fǎ tíng;安定|ān dìng;占据|zhàn jù;会意|huì yì;执行|zhí xíng;过度|guò dù"],
  ["b", "下册", 12, "为人民服务", "革命|gé mìng;解放|jiě fàng;彻底|chè dǐ;利益|lì yì;意义|yì yì;剥削|bō xuē;压迫|yā pò;批评|pī píng;兴旺|xīng wàng;五湖四海|wǔ hú sì hǎi;目标|mù biāo;责任|zé rèn;牺牲|xī shēng;死得其所|sǐ dé qí suǒ;制度|zhì dù;寄托|jì tuō;哀思|āi sī"],
  ["b", "下册", 15, "真理诞生于一百个问号之后", "真理|zhēn lǐ;领域|lǐng yù;建树|jiàn shù;司空见惯|sī kōng jiàn guàn;疑问|yí wèn;敏感|mǐn gǎn;提取|tí qǔ;明显|míng xiǎn;无聊|wú liáo;不可思议|bù kě sī yì;吻合|wěn hé;偶然|ǒu rán;文献|wén xiàn;证据|zhèng jù;系统|xì tǒng;整理|zhěng lǐ;见微知著|jiàn wēi zhī zhù;灵感|líng gǎn;机遇|jī yù"],
  ["b", "下册", 16, "表里的生物", "机器|jī qì;钟楼|zhōng lóu;洪亮|hóng liàng;街心|jiē xīn;盲人|máng rén;坚硬|jiān yìng;清脆|qīng cuì;单调|dān diào;请求|qǐng qiú;加速|jiā sù;齿轮|chǐ lún;玻璃|bō li;唯恐|wéi kǒng;丑恶|chǒu è;恐怖|kǒng bù;证实|zhèng shí"],
];
export const grade6Words = lessons.map(([book,term,lesson,title,words]) => {
  const id=`pep-2019-6${book}-l${lesson}`;
  return {id,grade:'六年级',edition:'统编语文（2019年版）',term,title:`第${lesson}课 ${title}`,wordListOnly:true,
    source:'人教社2019年版六年级语文词语表；2026-10-15核对教育部门学校站点公开教材。拼音为项目校订，本词表用于读音选词与看拼音写词，不含课文全文及词义讲解。',
    sourceUrl:`https://lywgyxx.szftedu.cn/xkjc/yw/202209/${book==='a'?'U020220910607209595293':'U020220910606887845853'}.pdf`,
    items:words.split(';').map(pair => {const [word,pinyin]=pair.split('|');return {id:`${id}-${word}`,word,pinyin,meaning:`第${lesson}课《${title}》词语表用词。`};}),
  };
});
