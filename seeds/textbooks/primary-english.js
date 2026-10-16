// Word lists (I), checked against the original textbook pages; translations are project glosses.
const inventories = [
  [
    3,
    "a",
    2012,
    1,
    "Hello!",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "Hello!|你好（见面问候）;Good morning.|早上好。;Miss|小姐;Hi.|嗨（随意招呼）;Good afternoon.|下午好。;class|同学们;I|我（主格）;I'm|我是（I am 的缩写）"
  ],
  [
    3,
    "a",
    2012,
    2,
    "I'm Liu Tao",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "are|是（与 you 等连用）;you|你;yes|是或对;am|是（与 I 连用）;no|不或不是;not|不（否定词）;Goodbye.|再见。"
  ],
  [
    3,
    "a",
    2012,
    3,
    "My friends",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "my|我的;friend|朋友;she|她;she's|她是（she is 的缩写）;he|他;he's|他是（he is 的缩写）;too|也;this|这个;is|是（单数第三人称）;sister|姐姐或妹妹"
  ],
  [
    3,
    "a",
    2012,
    4,
    "My family",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "family|家庭;father|爸爸;mother|妈妈;brother|哥哥或弟弟;me|我（宾格）;grandpa|爷爷或外公;grandma|奶奶或外婆;Good evening.|晚上好。"
  ],
  [
    3,
    "a",
    2012,
    5,
    "Look at me!",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "look at|看;T-shirt|T恤衫;it|它;it's|它是（it is 的缩写）;nice|好看的;skirt|裙子;How nice!|真好看！;cap|帽子;great|好极了;jacket|夹克衫;new|新的;What colour ...?|……是什么颜色的？;red|红色的"
  ],
  [
    3,
    "a",
    2012,
    6,
    "Colours",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "colour|颜色;orange|橙色的;now|现在;green|绿色的;and|和;yellow|黄色的;black|黑色的;blue|蓝色的;brown|棕色的;white|白色的;Would you like ...?|你想要……吗？;an|一个（元音音素前）;egg|鸡蛋;Yes, please.|好的，太感谢了。;or|或者"
  ],
  [
    3,
    "a",
    2012,
    7,
    "Would you like a pie?",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "a|一个（辅音音素前）;pie|馅饼;Nice to meet you.|很高兴认识你。;No, thank you.|不，谢谢你。;What about ...?|……怎么样？;cake|蛋糕;ice cream|冰淇淋;sweet|糖果;hot dog|热狗;look|看;what|什么;what's|什么是（what is 的缩写）"
  ],
  [
    3,
    "a",
    2012,
    8,
    "Happy New Year!",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "Happy New Year!|新年快乐！;uncle|叔伯舅姑父等男性长辈;This is for you.|这是给你的。;doll|玩具娃娃;that|那个;ball|球;robot|机器人;CD|光盘;car|小汽车;Happy Birthday!|生日快乐！;toy|玩具;ah|啊;ha|哈"
  ],
  [
    3,
    "b",
    2012,
    1,
    "In class",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "in class|在上课;Stand up.|起立;Mr|先生;Sit down.|坐下;please|请;open|打开;the|这个或那个（定冠词）;door|门;sorry|对不起;come in|进来;close|关上;window|窗户;blackboard|黑板;book|书;rubber|橡皮;don't|不（do not 的缩写）;listen to|听;parrot|鹦鹉"
  ],
  [
    3,
    "b",
    2012,
    2,
    "In the library",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "in|在……里面;library|图书馆;shh|嘘;shout|喊叫;run|跑;eat|吃;here|这里;talk|说话;sleep|睡觉;drink|喝;milk|牛奶;English|英语;your|你的或你们的"
  ],
  [
    3,
    "b",
    2012,
    3,
    "Is this your pencil?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "pencil|铅笔;isn't|不是（is not 的缩写）;that's|那是（that is 的缩写）;schoolbag|书包;pen|钢笔;crayon|蜡笔;ruler|尺;pencil case|铅笔盒;lunch box|午餐盒;where|在哪里;where's|在哪里（where is 的缩写）;over there|在那里"
  ],
  [
    3,
    "b",
    2012,
    4,
    "Where's the bird?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "bird|鸟;beautiful|美丽的;under|在……下面;desk|课桌;behind|在……后面;on|在……上面;chair|椅子;tree|树;guess|猜;one|一;two|二;three|三;oh|哦;wow|哇"
  ],
  [
    3,
    "b",
    2012,
    5,
    "How old are you?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "How old are you?|你几岁了？;lovely|可爱的;nine|九;eight|八;four|四;five|五;six|六;seven|七;ten|十;right|对的或正确的;out|出局;What a nice cake!|多么漂亮的蛋糕啊！;Make a wish.|许个愿吧。;want|想要;It's time for ...|该是……的时候了"
  ],
  [
    3,
    "b",
    2012,
    6,
    "What time is it?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "What time is it?|几点了？;wake up|醒来;mum|妈妈;o'clock|……点钟;breakfast|早餐;Hurry up.|快点。;class|课或上课;dinner|晚餐;bed|床;OK|好或行;lunch|午餐;eleven|十一;twelve|十二;bag|包;these|这些;here's|这是（here is 的缩写）"
  ],
  [
    3,
    "b",
    2012,
    7,
    "On the farm",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "farm|农场;Welcome to ...|欢迎来到……;they|他们、她们或它们;they're|他们是（they are 的缩写）;pig|猪;those|那些;cow|奶牛;apple|苹果;pear|梨;chicken|鸡;duck|鸭;orange|橙子;picture|图画或照片;who|谁;who's|谁是（who is 的缩写）"
  ],
  [
    3,
    "b",
    2012,
    8,
    "We're twins!",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=fb3eb403f0622e0a785a93e9aff7269f",
    "we|我们;we're|我们是（we are 的缩写）;twin|双胞胎之一;aunt|姑母、姨母等女性长辈;girl|女孩;man|男人;woman|女人;boy|男孩;baby|婴儿;cousin|堂兄弟姐妹或表兄弟姐妹;name|名字"
  ],
  [
    4,
    "a",
    2013,
    1,
    "I like dogs",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "like|喜欢;dog|狗;animal|动物;cat|猫;cute|可爱的;panda|熊猫;fat|胖的;elephant|大象;horse|马;lion|狮子;monkey|猴子;tiger|老虎;have|有"
  ],
  [
    4,
    "a",
    2013,
    2,
    "Let's make a fruit salad",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "Let's ...|咱们……;make|制作;fruit|水果;salad|色拉;pineapple|菠萝;mango|芒果;any|一些（疑问或否定句）;banana|香蕉;some|一些（肯定句）;grape|葡萄;Thanks.|谢谢。;our|我们的;cool|酷;wonderful|精彩的;how many|多少个"
  ],
  [
    4,
    "a",
    2013,
    3,
    "How many?",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "thirteen|十三;sticker|贴纸;can|能够;have a look|看一看;very|非常;fifteen|十五;sure|当然;fourteen|十四;sixteen|十六;seventeen|十七;eighteen|十八;nineteen|十九;play|打球或玩;many|许多;box|盒子;table tennis|乒乓球;but|但是;do|做"
  ],
  [
    4,
    "a",
    2013,
    4,
    "I can play basketball",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "basketball|篮球;well|好;can't|不能（cannot 的缩写）;have a try|试一试;yeah|是的;football|足球;jump|跳;skate|溜冰;swim|游泳;quack|鸭子的叫声;tweet|小鸟的叫声;fly|飞;ouch|哎哟;sad|难过的;either|也（用于否定句）"
  ],
  [
    4,
    "a",
    2013,
    5,
    "Our new home",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "home|家;bedroom|卧室;living room|客厅;sofa|沙发;come|来;kitchen|厨房;clock|钟;fridge|冰箱;table|桌子;bathroom|卫生间;How are you?|你好吗？;hungry|饥饿的;What would you like?|你想要什么？;I'd like ...|我想要……"
  ],
  [
    4,
    "a",
    2013,
    6,
    "At the snack bar",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "at|在某处;snack bar|小吃店;hamburger|汉堡包;a glass of|一杯（玻璃杯）;noodles|面条;dad|爸爸;sandwich|三明治;a cup of|一杯（茶杯）;coffee|咖啡;Anything else?|还要其他东西吗？;tea|茶;juice|果汁;rice|米饭;Me too.|我也是。;fish|鱼;Can I help you?|我能帮你吗？;big|大的"
  ],
  [
    4,
    "a",
    2013,
    7,
    "How much?",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "how much|多少钱;shoe|鞋子;yuan|人民币元;sock|袜子;umbrella|伞;only|仅仅;twenty-eight|二十八;Well done.|干得好。;fan|扇子;twenty|二十;thirty|三十;forty|四十;fifty|五十;forty-five|四十五;her|她的;tail|尾巴;long|长的"
  ],
  [
    4,
    "a",
    2013,
    8,
    "Dolls",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "hair|头发;eye|眼睛;nose|鼻子;mouth|嘴巴;small|小的;his|他的;short|矮的或短的;ear|耳朵;king|国王;thin|瘦的;tall|高的;snowman|雪人"
  ],
  [
    4,
    "b",
    2013,
    1,
    "Our school subjects",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "school|学校;subject|课程;Welcome back to ...|欢迎回到……;see|看见;timetable|课程表;Chinese|语文课;Maths|数学课;Art|美术课;PE|体育课;Music|音乐课;Science|科学课;fun|乐趣;go to ...|去……;playground|操场;lesson|课;Monday|星期一;afternoon|下午"
  ],
  [
    4,
    "b",
    2013,
    2,
    "After school",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "after school|放学后;go|去;What day is it today?|今天星期几？;Wednesday|星期三;match|比赛;today|今天;What a pity!|真遗憾！;Saturday|星期六;All right.|好的。;Sunday|星期日;Tuesday|星期二;Thursday|星期四;Friday|星期五;get up|起床;when|什么时候;every|每个;day|天"
  ],
  [
    4,
    "b",
    2013,
    3,
    "My day",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "usually|通常;go to school|上学;in the morning|在上午;have lunch|吃午饭;in the afternoon|在下午;play football|踢足球;go home|回家;homework|家庭作业;have dinner|吃晚饭;watch TV|看电视;go to bed|睡觉;in the evening|在晚上;at night|在夜里"
  ],
  [
    4,
    "b",
    2013,
    4,
    "Drawing in the park",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "drawing|画画;park|公园;draw|画;Good idea!|好主意！;flower|花;them|他们、她们或它们（宾格）;boat|小船;river|河流;difficult|困难的;easy|容易的;try|尝试;hill|小山;again|再一次;lake|湖泊"
  ],
  [
    4,
    "b",
    2013,
    5,
    "Seasons",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "season|季节;spring|春天;warm|温暖的;kite|风筝;go boating|去划船;summer|夏天;hot|热的;go swimming|去游泳;autumn|秋天;cool|凉爽的;picnic|野餐;go climbing|去爬山;winter|冬天;cold|寒冷的;go skating|去溜冰;fine|晴朗的;hey|嘿;whose|谁的;fly|放风筝等"
  ],
  [
    4,
    "b",
    2013,
    6,
    "Whose dress is this?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "dress|连衣裙;too|太;trousers|裤子;party|聚会;glove|手套;so|这么;coat|外套;shirt|衬衫;sweater|毛衣;jeans|牛仔裤;shorts|短裤;wrong|错误的;move|移动;I think so.|我想是。;What's the matter?|怎么了？;hand|手;hurt|感到疼痛"
  ],
  [
    4,
    "b",
    2013,
    7,
    "What's the matter?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "thirsty|口渴的;water|水;ill|生病的;tired|累的;Good night.|晚安。;dear|亲爱的;happy|高兴的;Mrs|夫人;speak|说话"
  ],
  [
    4,
    "b",
    2013,
    8,
    "How are you?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=3cb7994ca1d2f068d4435ca671e035cf",
    "may|可以;come to school|来学校;cold|感冒;fever|发烧;hear|听到;Take care.|保重。;I'm fine, thank you.|我很好，谢谢你。;See you tomorrow.|明天见。;See you.|再见。;cough|咳嗽;headache|头痛;Not so good.|不太好。;at school|在学校"
  ],
  [
    5,
    "a",
    2014,
    1,
    "Goldilocks and the three bears",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "bear|熊;forest|森林;there|有（与 be 连用）;house|房子;soup|汤;just right|正合适;room|房间;hard|硬的;soft|软的;afraid|害怕的;in front of|在……前面;her|她（宾格）;Help!|救命啊！;beside|在……旁边;between|在……中间;China|中国;really|真的;then|然后;find|找到;their|他们的、她们的或它们的"
  ],
  [
    5,
    "a",
    2014,
    2,
    "A new student",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "student|学生;show ... around|带……参观;classroom|教室;second|第二;floor|楼层;computer|电脑;third|第三;first|第一;swing|秋千;push|推;heavy|重的;stop|停止;high|高的;great|很大的"
  ],
  [
    5,
    "a",
    2014,
    3,
    "Our animal friends",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "one ..., the other ...|一个……，另一个……;body|身体;no|没有;leg|腿;or|也不（否定句）;arm|手臂;wing|翅膀;foot|脚;rabbit|兔子;give|给;finger|手指"
  ],
  [
    5,
    "a",
    2014,
    4,
    "Hobbies",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "hobby|爱好;be good at|擅长;with|与……一起;also|也;read|阅读;story|故事;a lot of|很多;play the piano|弹钢琴;dance|跳舞;watch films|看电影;both|两个都;sing|唱歌;group|组;about|关于;idea|主意;ice|冰;hole|洞;Look out!|当心！;wet|湿的"
  ],
  [
    5,
    "a",
    2014,
    5,
    "What do they do?",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "teacher|老师;teach|教;writer|作家;write|写;work|工作;at home|在家;doctor|医生;help|帮助;sick|生病的;people|人们;factory|工厂;worker|工人;driver|司机;farmer|农民;nurse|护士;policeman|警察;cook|厨师"
  ],
  [
    5,
    "a",
    2014,
    6,
    "My e-friend",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "e-friend|网友;Wait a minute.|等一会儿。;email|电子邮件;to|给;live|居住;UK|英国;... years old|……岁;study|学习;Canada|加拿大;Greece|希腊;Russia|俄罗斯;PRC|中华人民共和国;US|美国;go fishing|去钓鱼;tomorrow|明天;fishing|钓鱼;Don't worry.|别担心。;sit|坐;by|在……旁边;wait|等待;send|发送"
  ],
  [
    5,
    "a",
    2014,
    7,
    "At weekends",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "at weekends|在周末;visit|拜访;grandparent|祖父母或外祖父母之一;play with|和……一起玩;very much|非常;often|经常;chat|聊天;Internet|互联网;always|总是;sometimes|有时;go to the cinema|去看电影;there|那里;a lot|很多;come out|出来;get out|出去"
  ],
  [
    5,
    "a",
    2014,
    8,
    "At Christmas",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "Christmas|圣诞节;buy|买;present|礼物;Christmas tree|圣诞树;Father Christmas|圣诞老人;next|接着;put|放;pretty|漂亮的;thing|物品;look|看起来;Christmas Eve|平安夜;stocking|长筒袜;wait for|等候;finally|最后;Christmas Day|圣诞节当天;early|早早地;turkey|火鸡;pudding|布丁;all|全部;have a good time|玩得开心;card|卡片;children|孩子们;message|信息;Merry Christmas!|圣诞快乐！;song|歌曲;What's wrong with ...?|……怎么了？;him|他（宾格）;letter|信;storybook|故事书;after|在……以后;us|我们（宾格）"
  ],
  [
    5,
    "b",
    2014,
    1,
    "Cinderella",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "prince|王子;fairy|仙女;why|为什么;because|因为;clothes|衣服;let|让;put on|穿上;before|在……以前;have to|不得不;try on|试穿;fit|合适;take off|脱下;mushroom|蘑菇;late|迟的;pick|摘;understand|明白;be bad for|对……有害;leave ... behind|丢下……"
  ],
  [
    5,
    "b",
    2014,
    2,
    "How do you come to school?",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "far from|离……远;moon|月亮;street|街道;near|在……附近;city|城市;by|乘（交通工具）;bus|公共汽车;on foot|步行;metro|地铁;taxi|出租车;bike|自行车;plane|飞机;ship|轮船;train|火车;ride|骑车;show|给……看;young|年幼的;basket|篮子"
  ],
  [
    5,
    "b",
    2014,
    3,
    "Asking the way",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "ask the way|问路;get to|到达;take|搭乘;get on|上车;station|车站;get off|下车;walk|步行;bookshop|书店;next to|在……旁边;sun|太阳;ask ... for help|向……求助;excuse me|打扰了;along|沿着;turn right|向右转;traffic light|交通灯;on your right|在你的右边;cinema|电影院;hospital|医院;shop|商店;turn left|向左转;supermarket|超市;stop|车站（停靠站）;over|结束了;zoo|动物园;film|电影;full|满的或饱的"
  ],
  [
    5,
    "b",
    2014,
    4,
    "Seeing the doctor",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "see the doctor|看医生;feel|感觉;check|检查;should|应该;have a rest|休息;take medicine|吃药;drink water|喝水;toothache|牙痛;dentist|牙医;anything|任何东西;brush one's teeth|刷牙;bedtime|就寝时间;giraffe|长颈鹿;point at|指着;neck|脖子"
  ],
  [
    5,
    "b",
    2014,
    5,
    "Helping our parents",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "parent|父亲或母亲;clean|擦洗;cook|烧或煮;sweep the floor|扫地;busy|忙碌的;wash the dishes|洗碗;make the bed|整理床铺;grow|种植;garden|花园;sweet|甜的;pest|害虫;ladybird|瓢虫;go away|离开"
  ],
  [
    5,
    "b",
    2014,
    6,
    "In the kitchen",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "game|运动或比赛;smell|有……气味;meat|肉;vegetable|蔬菜;tomato|西红柿;potato|土豆;I can't wait!|我等不及了！;look for|寻找;ready|准备好;yummy|美味的;love|喜爱;bread|面包;win|获胜;yeah|太好了;angry|生气的;spot|斑点;drive ... away|赶走……;catch|抓住"
  ],
  [
    5,
    "b",
    2014,
    7,
    "Chinese festivals",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "festival|节日;Spring Festival|春节;January|一月;February|二月;call|叫作;Chinese New Year|中国农历新年;get together|团聚;jiaozi|饺子;Dragon Boat Festival|端午节;May|五月;June|六月;dragon boat race|赛龙舟;place|地方;rice dumpling|粽子;Mid-Autumn Festival|中秋节;September|九月;October|十月;moon cake|月饼;Double Ninth Festival|重阳节;November|十一月;old|年纪大的;mountain|山;rice cake|重阳糕;Mother's Day|母亲节;Father's Day|父亲节;favourite|最喜欢的"
  ],
  [
    5,
    "b",
    2014,
    8,
    "Birthdays",
    "https://edu.yilin.com/index.php/Category/show?nav_id=14&cat_id=31&resid=f381b4c1229dc8c4976cd49934dac8f0",
    "birthday|生日;eleventh|第十一;eighth|第八;April|四月;together|一起;game|游戏;March|三月;July|七月;August|八月;December|十二月;hero|英雄;play|戏剧;number|数字;password|密码;answer|答案;fourth|第四;start|开始;fight|打仗"
  ],
  [
    6,
    "a",
    2014,
    1,
    "The king's new clothes",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "long long ago|很久以前;magic|有魔力的;clever|聪明的;foolish|愚蠢的;through|穿过;laugh|大笑;wear|穿;tell|讲述;each|每个;say|说;sentence|句子;quick|迅速的;next|下一个;little|小的;turn|轮到的机会;think|想;hard|努力地;laugh at|嘲笑;grandchildren|孙子女或外孙子女;move ... away|把……搬走;child|孩子"
  ],
  [
    6,
    "a",
    2014,
    2,
    "What a day!",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "sunny|晴朗的;show|展览;interesting|有趣的;weather|天气;become|变成;windy|有风的;cloudy|多云的;high|在高处;sky|天空;bring|带来;honey|蜂蜜;drink|饮料;ant|蚂蚁;bee|蜜蜂;cloud|云;rain|下雨;rainy|多雨的;meet|遇见;lose|丢失;know|知道;What happened?|出什么事了？;climb up|爬上;hold onto|抓紧;fly away|飞走"
  ],
  [
    6,
    "a",
    2014,
    3,
    "Holiday fun",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "holiday|假期;National Day|国庆节;call|打电话;Bund|外滩;Shanghai Museum|上海博物馆;Great Wall|长城;Palace Museum|故宫;Summer Palace|颐和园;Tian'anmen Square|天安门广场;fashion show|时装表演;excited|激动的;paper|纸;ask|问;bottle|瓶子;go well|进展顺利;at first|开始时;heavy rain|大雨"
  ],
  [
    6,
    "a",
    2014,
    4,
    "Then and now",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "then and now|过去和现在;ago|……以前;telephone|电话;office|办公室;mobile phone|手机;anywhere|随处;radio|收音机;newspaper|报纸;news|新闻;watch|观看;e-book|电子书;make friends|交朋友;all over the world|全世界;do shopping|购物;TV|电视机;look out of|向……外看;go on|继续;still|仍然;What day is today?|今天星期几？;spell|拼写;make a sentence|造句;with|用;yesterday|昨天;use|使用"
  ],
  [
    6,
    "a",
    2014,
    5,
    "Signs",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "sign|标识;shopping centre|购物中心;careful|小心的;What does it mean?|它是什么意思？;floor|地面;litter|乱扔垃圾;go in|进入;take ... into|把……带入;restaurant|餐馆;someone|某人;smoke|吸烟;smell|闻到;No eating or drinking.|禁止饮食。;No littering.|禁止乱扔垃圾。;No parking.|禁止停车。;No smoking.|禁止吸烟。;Danger!|危险！;Wet floor.|小心地滑。;walk on|继续走路;around|在……周围;mean|意思是;outing|外出游玩"
  ],
  [
    6,
    "a",
    2014,
    6,
    "Keep our city clean",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "keep|保持;clean|干净的;make|使……变得;air|空气;dirty|脏的;smoke|烟;rubbish|垃圾;messy|肮脏杂乱的;dead|死的;move ... away from|把……从……搬走;bin|垃圾桶;plant|种植;more|更多的;museum|博物馆;throw|扔;skin|果皮;ground|地面;pick ... up|捡起……;slip|滑倒;fall|摔倒"
  ],
  [
    6,
    "a",
    2014,
    7,
    "Protect the Earth",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "protect|保护;Earth|地球;save|节约;useful|有用的;waste|浪费;reuse|再利用;energy|能源;most|大部分;come from|来自;coal|煤炭;oil|石油;drive|驾驶;wood|木材;other|其他的;cut down|砍伐;too many|太多（可数名词）;too much|太多（不可数名词）;plastic|塑料;glass|玻璃;project|课题;poster|海报;gate|大门;much|很多"
  ],
  [
    6,
    "a",
    2014,
    8,
    "Chinese New Year",
    "https://github.com/TapXWorld/ChinaTextbook/tree/5a80345f2043ba6f8db8d7be9cf3db82725ff1f7/%E5%B0%8F%E5%AD%A6/%E8%8B%B1%E8%AF%AD/%E8%AF%91%E6%9E%97%E7%89%88%E4%B8%89%E5%B9%B4%E7%BA%A7%E8%B5%B7%E7%82%B9",
    "Hong Kong|香港;next week|下周;food|食物;tangyuan|汤圆;Chinese New Year's Eve|除夕;Chinese New Year's Day|大年初一;red packet|红包;lion dance|舞狮;fireworks|烟花表演;firecracker|鞭炮;rich|富有的;plan|计划;hooray|好极了;light|点燃;get|收到"
  ]
];
export const primaryEnglish = inventories.map(([grade,term,year,number,title,sourceUrl,words]) => {
  const id=`yilin-${year}-${grade}${term}-u${number}`;
  return {id,grade:`${'一二三四五六'[grade-1]}年级`,edition:`译林英语（三年级起点，${year}年版）`,term:term==='a'?'上册':'下册',title:`Unit ${number} ${title}`,
    source:`译林《英语》${'一二三四五六'[grade-1]}年级${term==='a'?'上册':'下册'} Word lists (I)，${grade<=4?(grade===3&&term==='a'?'第62–64页':'第60–62页'):'第92–94页'}；${term==='a'?'原教材公开镜像，非出版社直链':'出版社公开文件'}；2026-10-16核对。释义为项目简释，缩写按词表收录。`,sourceUrl,
    items:words.split(';').map(pair=>{const [word,meaning]=pair.split('|');return {id:`${id}-${word.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,word,meaning};}),
  };
});
