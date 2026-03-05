/**
 * 新しい試合に対してメディア評価・現地の声・Xスレッドを自動生成するスクリプト
 * 試合結果に基づいてテンプレートからコンテンツを生成
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// データファイルのパス
const DATA_DIR = join(__dirname, "../src/data");
const PLAYERS_FILE = join(DATA_DIR, "players.json");
const MATCHES_FILE = join(DATA_DIR, "matches.json");
const MEDIA_RATINGS_FILE = join(DATA_DIR, "media-ratings.json");

// 型定義
interface Player {
  id: string;
  name: { ja: string; en: string };
  club: { name: string; shortName: string };
  league: { name: string; shortName: string; country: string };
  position: string;
}

interface Match {
  matchId: string;
  playerId: string;
  date: string;
  competition: string;
  homeTeam: { name: string; score: number };
  awayTeam: { name: string; score: number };
  playerStats: {
    minutesPlayed: number;
    goals: number;
    assists: number;
    starting: boolean;
    position: string;
    rating: number;
  };
  notable: boolean;
}

interface MediaRating {
  source: string;
  country: string;
  rating: number;
  maxRating: number;
  ratingSystem: string;
  comment?: string;
  commentTranslated?: string;
  isManual?: boolean;
  articleUrl?: string;
  hasArticleRating?: boolean;
}

interface LocalVoice {
  id: string;
  username: string;
  role: string;
  roleKey: string;
  languageCode: string;
  originalText: string;
  translatedText: string;
}

interface XThread {
  id: string;
  username: string;
  verified: boolean;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
  retweets: number;
  replies?: XReply[];
}

interface XReply {
  id: string;
  username: string;
  languageCode: string;
  originalText: string;
  translatedText: string;
  likes: number;
}

interface MatchMediaData {
  matchId: string;
  playerId: string;
  ratings: MediaRating[];
  averageRating: number;
  localVoices: LocalVoice[];
  xThreads: XThread[];
  lastUpdated?: string;
}

// 国別メディアソース
const MEDIA_SOURCES: Record<string, { source: string; country: string }[]> = {
  イングランド: [
    { source: "Sky Sports", country: "イングランド" },
    { source: "WhoScored", country: "イングランド" },
    { source: "BBC Sport", country: "イングランド" },
  ],
  スペイン: [
    { source: "MARCA", country: "スペイン" },
    { source: "AS", country: "スペイン" },
    { source: "WhoScored", country: "イングランド" },
  ],
  ドイツ: [
    { source: "kicker", country: "ドイツ" },
    { source: "Bild", country: "ドイツ" },
    { source: "WhoScored", country: "イングランド" },
  ],
  オランダ: [
    { source: "Voetbal International", country: "オランダ" },
    { source: "De Telegraaf", country: "オランダ" },
    { source: "WhoScored", country: "イングランド" },
  ],
  フランス: [
    { source: "L'Équipe", country: "フランス" },
    { source: "WhoScored", country: "イングランド" },
  ],
  イタリア: [
    { source: "La Gazzetta dello Sport", country: "イタリア" },
    { source: "WhoScored", country: "イングランド" },
  ],
};

// 国別言語コード
const COUNTRY_LANGUAGE: Record<string, string> = {
  イングランド: "EN",
  スペイン: "ES",
  ドイツ: "DE",
  オランダ: "NL",
  フランス: "FR",
  イタリア: "IT",
};

// メディアコメントテンプレート（パフォーマンスレベル別、オリジナル+翻訳）
interface CommentTemplate {
  original: string;
  translated: string;
}

const MEDIA_COMMENT_TEMPLATES: Record<string, Record<string, CommentTemplate[]>> = {
  excellent: {
    EN: [
      { original: "Outstanding performance that lit up the match. Controlled the tempo throughout and created multiple clear-cut chances with his vision and passing range. His movement off the ball was exceptional, constantly finding pockets of space that the opposition simply couldn't cope with. A display that underlined his growing importance to the team.", translated: "試合を彩る傑出したパフォーマンス。終始テンポをコントロールし、そのビジョンとパスレンジで複数の決定機を演出した。オフ・ザ・ボールの動きも卓越しており、相手が対処しきれないスペースを常に見つけ出した。チームにおける存在感の高まりを裏付けるプレーだった。" },
      { original: "Exceptional display from start to finish. A constant threat on the wing with superb decision-making in the final third. Drew multiple fouls and created overloads that stretched the opposing defence to breaking point. His work rate without the ball was equally impressive, pressing high and winning possession back in dangerous areas.", translated: "キックオフから最後まで卓越したプレー。ファイナルサードでの判断力が素晴らしく、サイドで常に脅威を与え続けた。複数のファウルを誘発し、オーバーロードを作り出して相手の守備を限界まで引き伸ばした。ボールを持たない時の運動量も同様に印象的で、高い位置からプレスをかけ、危険なエリアでボールを奪い返した。" },
      { original: "Man of the match caliber performance. Dominated his area of the pitch from the first whistle, dictating play with a composure that belied the intensity of the occasion. His passing accuracy was near-perfect, and he combined a creative spark with defensive diligence. The kind of complete performance that managers dream of.", translated: "マン・オブ・ザ・マッチ級のパフォーマンス。開始の笛から自分のエリアを支配し、試合の激しさからは想像できない落ち着きでプレーを操った。パス精度はほぼ完璧で、創造性と守備の勤勉さを両立させた。監督が夢見るような完全なパフォーマンスだった。" },
      { original: "Brilliant showing that had the crowd on their feet. Combined beautifully with his teammates, showing great vision and awareness of the spaces around him. Every touch was purposeful, every run was intelligent. His influence on the game was clear for all to see, and he fully deserved the standing ovation he received.", translated: "観客を立ち上がらせる見事なプレー。チームメイトと美しく連携し、周囲のスペースへの優れたビジョンと意識を見せた。すべてのタッチに意図があり、すべてのランニングが知的だった。試合への影響は誰の目にも明らかで、受けたスタンディングオベーションは完全に相応しいものだった。" },
    ],
    DE: [
      { original: "Herausragende Leistung, die das Spiel prägte. Kontrollierte das Tempo souverän und schuf mehrere hochkarätige Chancen mit seiner Übersicht und Passqualität. Seine Laufwege ohne Ball waren erstklassig, und er fand immer wieder Räume, die der Gegner nicht schließen konnte. Eine Vorstellung, die seine wachsende Bedeutung für die Mannschaft unterstrich.", translated: "試合を彩る傑出したパフォーマンス。テンポを堂々とコントロールし、その視野とパスの質で複数の決定機を作り出した。ボールなしの動きは一流で、相手が埋められないスペースを繰り返し見つけ出した。チームにおける重要性の高まりを裏付ける出来だった。" },
      { original: "Überragend von der ersten bis zur letzten Minute. War ständig gefährlich, traf kluge Entscheidungen im letzten Drittel und zeigte ein außergewöhnliches Spielverständnis. Seine Zweikampfstärke und sein unermüdlicher Einsatz machten ihn zum Schlüsselspieler dieser Partie.", translated: "最初から最後まで圧倒的だった。常に危険な存在で、ファイナルサードでの賢明な判断と卓越した試合理解力を見せた。デュエルの強さとたゆまぬ献身性が、この試合のキープレーヤーたらしめた。" },
      { original: "Spieler des Spiels – und das völlig verdient. Dominierte das Geschehen durchgehend, setzte seine Mitspieler immer wieder gekonnt in Szene und war mit seiner Dynamik kaum zu stoppen. Eine Weltklasse-Leistung, die Erinnerungen an seine besten Auftritte weckt.", translated: "試合のベストプレーヤー──完全に相応しい。終始試合を支配し、チームメイトを巧みに活かし続け、そのダイナミズムはほとんど止められなかった。彼の最高のパフォーマンスを彷彿とさせるワールドクラスの出来だった。" },
    ],
    ES: [
      { original: "Actuación excepcional que iluminó el partido. Controló el ritmo con una naturalidad asombrosa, creando múltiples ocasiones de gol con su visión y capacidad de pase. Su movimiento sin balón fue brillante, encontrando espacios que la defensa rival simplemente no podía cubrir. Un despliegue que confirma su creciente importancia en el equipo.", translated: "試合を照らす卓越したパフォーマンス。驚くべき自然さでリズムをコントロールし、そのビジョンとパス能力で複数のゴールチャンスを生み出した。ボールを持たない動きも素晴らしく、相手守備が埋められないスペースを見つけ出した。チームにおける重要性の高まりを確認する出来だった。" },
      { original: "Exhibición brillante de principio a fin. Una amenaza constante por la banda con decisiones inteligentes en el último tercio. Su capacidad para desequilibrar con el regate y su lectura del juego fueron sobresalientes. El público no dejó de aplaudirle.", translated: "最初から最後まで見事な出来。サイドで常に脅威となり、ファイナルサードでの判断が知的だった。ドリブルで均衡を崩す能力と試合を読む力が傑出していた。観客からの拍手が絶えなかった。" },
    ],
    NL: [
      { original: "Uitstekende prestatie die de wedstrijd kleur gaf. Beheerste het tempo van begin tot eind en creëerde meerdere grote kansen met zijn overzicht en passvermogen. Zijn beweging zonder bal was uitzonderlijk, waardoor hij steeds weer vrij kwam in gevaarlijke posities. Een optreden dat zijn groeiende waarde voor het team bevestigt.", translated: "試合に色を添える素晴らしいパフォーマンス。最初から最後までテンポを支配し、その視野とパス能力で複数の大きなチャンスを作り出した。ボールなしの動きが卓越しており、危険なポジションで繰り返しフリーになった。チームにとっての価値の高まりを確認する出来だった。" },
      { original: "Briljant optreden van de eerste tot de laatste minuut. Constant gevaarlijk met geweldige visie, sterk aan de bal en onvermoeibaar in zijn loopacties. Zijn technische klasse en spelintelligentie maakten het verschil in deze wedstrijd.", translated: "最初から最後まで輝かしいプレー。常に危険で素晴らしいビジョンを持ち、ボール扱いが巧みで、ランニングは疲れ知らずだった。そのテクニカルなクオリティと試合の知性がこの試合の違いを生んだ。" },
    ],
  },
  good: {
    EN: [
      { original: "Solid contribution that helped the team maintain control. Worked hard across the pitch, linking up well with teammates and providing a reliable outlet in possession. Showed good positioning throughout and made several important interventions when the team needed him most.", translated: "チームがコントロールを維持する上で堅実な貢献を見せた。ピッチ全体でハードワークし、チームメイトとよく連携してポゼッション時に信頼できるパスコースとなった。終始良いポジショニングを見せ、チームが最も必要とした場面でいくつかの重要な介入を行った。" },
      { original: "Reliable performance that showcased his growing maturity. Made some key passes that unlocked the defence and tracked back diligently when possession was lost. His tactical discipline was evident, rarely being caught out of position. A professional display that his manager will be pleased with.", translated: "成長する成熟度を示す頼れるパフォーマンス。守備を崩すキーパスを通し、ボールを失った際には献身的に戻った。戦術的な規律が明確で、ポジションを外すことがほとんどなかった。監督も満足するプロフェッショナルなプレーだった。" },
      { original: "Effective display in a hard-fought contest. Did his job without fuss, adding quality going forward while never neglecting his defensive responsibilities. His touch and passing were crisp, and he showed a good understanding of the game's rhythm. A quietly impressive outing.", translated: "激戦の中で効果的なプレー。目立たずとも役割を果たし、守備の責任を怠ることなく攻撃時にクオリティを加えた。タッチとパスがキレており、試合のリズムへの理解も良好だった。静かに印象的な出来だった。" },
      { original: "Composed showing in a tight encounter. Rarely gave the ball away, demonstrating excellent ball retention under pressure. His movement created space for others, and he showed good awareness of when to play simple and when to take risks. A mature display.", translated: "拮抗した試合で落ち着いたプレー。ボールロストが少なく、プレッシャー下での優れたボール保持を示した。その動きが味方にスペースを作り、シンプルにプレーすべき時とリスクを取るべき時の判断力を見せた。成熟したプレーだった。" },
    ],
    DE: [
      { original: "Solider Beitrag in einem umkämpften Spiel. Arbeitete hart über den gesamten Platz, verband sich gut mit den Mitspielern und bot sich als verlässliche Anspielstation an. Seine taktische Disziplin war auffällig, und er machte einige wichtige Ballgewinne in entscheidenden Momenten.", translated: "激戦の中での堅実な貢献。ピッチ全体でハードワークし、チームメイトとよく連携して信頼できるパスコースとなった。戦術的な規律が目立ち、決定的な場面でいくつかの重要なボール奪取を行った。" },
      { original: "Zuverlässige Leistung mit einigen wichtigen Pässen und diszipliniertem Rücklaufen. Zeigte ein gutes Gespür für den Spielrhythmus und war in seinen Aktionen stets besonnen. Ein Auftritt, der Vertrauen schafft und seine Konstanz unterstreicht.", translated: "重要なパスと規律ある守備を見せた信頼できるパフォーマンス。試合のリズムに対する良い感覚を示し、常に冷静なプレーだった。信頼を築き、安定感を裏付ける出来だった。" },
    ],
    ES: [
      { original: "Contribución sólida en un partido exigente. Trabajó duro por todo el campo, conectando bien con los compañeros y ofreciendo una opción fiable en posesión. Su disciplina táctica fue notable, y realizó varias intervenciones importantes cuando el equipo más lo necesitaba.", translated: "厳しい試合での堅実な貢献。ピッチ全体でハードワークし、チームメイトとよく繋がりポゼッション時に信頼できる選択肢となった。戦術的規律が注目に値し、チームが最も必要とした時にいくつかの重要な介入を行った。" },
      { original: "Actuación fiable que demostró su madurez creciente. Realizó pases clave que desarmaron la defensa y ayudó en labores defensivas con diligencia. Su lectura del juego fue acertada y su aportación al equipo, consistente.", translated: "成長する成熟度を示す信頼できるプレー。守備を崩すキーパスを出し、守備面でも勤勉に貢献した。試合の読みが的確で、チームへの貢献は一貫していた。" },
    ],
    NL: [
      { original: "Solide bijdrage in een lastige wedstrijd. Werkte hard over het hele veld, combineerde goed met teamgenoten en bood een betrouwbare aanspeeloptie. Zijn tactische discipline viel op, en hij maakte enkele belangrijke balveroveringen op cruciale momenten.", translated: "難しい試合での堅実な貢献。ピッチ全体でハードワークし、チームメイトとよくコンビネーションして信頼できるパスコースとなった。戦術的規律が目立ち、重要な場面でいくつかのボール奪取を行った。" },
      { original: "Betrouwbare prestatie met enkele slimme passes en een sterk positiespel. Liet zien dat hij het ritme van de wedstrijd goed aanvoelde en was zuiver in zijn acties. Een optreden dat vertrouwen geeft voor de komende weken.", translated: "巧みなパスと強いポジショニングを見せた頼れるパフォーマンス。試合のリズムをよく感じ取り、プレーの精度が高かった。今後に向けて信頼を与える出来だった。" },
    ],
  },
  average: {
    EN: [
      { original: "A quiet afternoon in which he struggled to find his rhythm. Service was limited, but when he did receive the ball, he showed moments of quality that reminded us of his ability. Defensively he remained disciplined, but going forward he lacked the spark we have come to expect from him.", translated: "リズムを掴むのに苦労した静かな午後だった。ボール供給は限られていたが、ボールを受けた時にはその能力を思い出させる質の高い瞬間を見せた。守備面では規律を保ったが、攻撃面では彼に期待されるキレを欠いた。" },
      { original: "Mixed display with some promising moments but an overall lack of consistency. He showed flashes of his best, particularly in the first half, but faded as the game wore on. The quality is clearly there, but today it appeared only in glimpses rather than sustained spells.", translated: "有望な瞬間もあったが全体的に一貫性を欠く出来だった。特に前半にはベストの片鱗を見せたが、試合が進むにつれて存在感が薄れた。クオリティがあるのは明らかだが、今日は持続的ではなく断片的にしか現れなかった。" },
      { original: "Subdued performance in a frustrating team display. Not his best day by any means, but he still contributed defensively and showed glimpses of his technical quality. Lacked the service to truly influence the game, though his work rate could not be faulted.", translated: "チーム全体がフラストレーションの溜まる中で控えめなパフォーマンス。決してベストの日ではなかったが、守備では貢献しテクニカルな質の片鱗も見せた。試合に真に影響を与えるボール供給を欠いたが、運動量は批判の余地がなかった。" },
      { original: "Inconsistent showing that left room for improvement. There were flashes of brilliance — a clever turn here, a precise pass there — but they were not sustained over the ninety minutes. He will know he can do better, and his manager will expect more in the coming weeks.", translated: "改善の余地を残す不安定なプレーだった。巧みなターンや正確なパスなど輝きの瞬間はあったが、90分間持続しなかった。本人ももっとできると分かっているはずで、監督も今後数週間でさらなる向上を期待するだろう。" },
    ],
    DE: [
      { original: "Ruhiger Nachmittag, an dem er seinen Rhythmus nicht fand. Wenig Ballbesitz und begrenzte Einbindung ins Kombinationsspiel. Wenn er den Ball hatte, zeigte er Qualität, doch diese Momente waren zu selten. Defensiv blieb er stabil, nach vorne fehlte der Zug zum Tor.", translated: "リズムを見つけられなかった静かな午後だった。ボール保持が少なくコンビネーションへの関与も限定的だった。ボールを持った時には質を見せたが、そのような場面は少なすぎた。守備は安定していたが、攻撃面ではゴールへの推進力を欠いた。" },
      { original: "Durchwachsene Leistung mit einigen guten Ansätzen, aber ohne Durchschlagskraft. In der ersten Halbzeit noch engagiert, ließ die Intensität nach der Pause nach. Die Klasse ist unbestritten, doch heute kam sie nur phasenweise zum Vorschein.", translated: "良い兆しはあったが決定力を欠いた出来にムラのあるパフォーマンス。前半はまだ積極的だったが、後半はインテンシティが低下した。クオリティは疑いないが、今日は断片的にしか発揮されなかった。" },
    ],
    ES: [
      { original: "Una tarde tranquila en la que le costó encontrar su ritmo. Recibió pocos balones, pero cuando los tuvo, mostró destellos de su calidad habitual. En defensa cumplió con disciplina, aunque en ataque le faltó esa chispa que le caracteriza. Un día de esos que todos los jugadores tienen.", translated: "リズムを見つけるのに苦労した静かな午後だった。ボールを受ける機会は少なかったが、受けた時にはいつもの質の片鱗を見せた。守備では規律を持って務めたが、攻撃では彼の特徴であるキレを欠いた。どの選手にもあるような日だった。" },
      { original: "Actuación irregular con momentos prometedores pero sin continuidad. Mostró su mejor versión a ratos, sobre todo en la primera parte, pero fue perdiendo protagonismo con el paso de los minutos. La calidad está ahí, pero hoy solo se vio a destellos.", translated: "有望な瞬間はあったが継続性のない不安定なプレー。特に前半には最高の姿を見せたが、時間の経過とともに存在感を失った。クオリティは確かにあるが、今日は閃きでしか見られなかった。" },
    ],
    NL: [
      { original: "Rustige middag waarin hij moeite had zijn ritme te vinden. Weinig balbezit, maar wanneer hij de bal kreeg, toonde hij momenten van klasse die zijn kwaliteit bevestigen. Verdedigend bleef hij gedisciplineerd, maar aanvallend ontbrak de scherpte die we van hem gewend zijn.", translated: "リズムを見つけるのに苦労した静かな午後だった。ボール保持は少なかったが、ボールを受けた時にはそのクオリティを確認させる瞬間を見せた。守備では規律を保ったが、攻撃面では慣れ親しんだキレを欠いた。" },
      { original: "Wisselvallige prestatie met enkele goede momenten, maar zonder de consistentie die hem kenmerkt. In de eerste helft nog betrokken, maar na rust minder zichtbaar. De klasse is er, maar vandaag kwam die alleen in vlagen naar voren.", translated: "良い瞬間はあったが、彼の特徴である一貫性を欠いた不安定なパフォーマンス。前半はまだ関与していたが、後半は目立たなくなった。クオリティはあるが、今日は断片的にしか現れなかった。" },
    ],
  },
  poor: {
    EN: [
      { original: "Struggled throughout a difficult encounter. Found it hard to get into the game as the opposition pressed high and cut off his supply lines. His touches were heavy at times, and he was unable to create the chances his team desperately needed. A frustrating afternoon that he will want to put behind him quickly.", translated: "厳しい試合を通じて苦戦した。相手の高いプレスでボール供給が断たれ、試合に入り込むのが難しかった。タッチが重い場面もあり、チームが切実に必要としていたチャンスを作れなかった。早く忘れたいフラストレーションの溜まる午後だった。" },
      { original: "Off the pace in a game that passed him by. Gave the ball away too often in dangerous areas and looked frustrated with his own inability to influence proceedings. The pressing intensity of the opposition seemed to catch him off guard, and he never truly settled into a rhythm. A rare off day.", translated: "試合のペースについていけず、存在感を示せなかった。危険なエリアでのボールロストが多く、自身が試合に影響を与えられないことへのフラストレーションが見て取れた。相手のプレス強度に不意を突かれたようで、最後までリズムを掴めなかった。珍しい不調の日だった。" },
      { original: "Disappointing display that fell well below his usual high standards. Struggled to find space against a well-organised defence and was guilty of some uncharacteristic errors in possession. His body language suggested frustration, and he was eventually substituted as the manager looked for a different approach.", translated: "いつもの高い水準を大きく下回る期待外れのパフォーマンス。よく組織された守備の前でスペースを見つけるのに苦労し、ポゼッション時に彼らしくないミスを犯した。ボディランゲージにフラストレーションが滲み、監督が異なるアプローチを模索する中で途中交代となった。" },
      { original: "A tough match in which little went right for him. The conditions, combined with a physical opponent, made it difficult for him to express himself. He showed character by never giving up, but the quality of his play was not at the level we know he is capable of. He will look to bounce back strongly in the next fixture.", translated: "彼にとってほとんど何もうまくいかない厳しい試合だった。コンディションとフィジカルの強い相手の組み合わせが自分らしさの発揮を困難にした。最後まで諦めない姿勢は見せたが、プレーの質は彼が発揮できるレベルではなかった。次の試合で力強い巻き返しを目指すだろう。" },
    ],
    DE: [
      { original: "Hatte von Beginn an Schwierigkeiten, ins Spiel zu finden. Die gegnerische Mannschaft presste hoch und schnitt ihm die Passwege ab. Seine Ballkontakte waren unpräzise, und es gelang ihm nicht, die nötigen Akzente zu setzen. Ein Nachmittag zum Vergessen, den er schnell abhaken wird.", translated: "序盤から試合に入るのに苦労した。相手チームが高い位置からプレスをかけ、パスコースを断った。ボールタッチが不正確で、必要なアクセントを付けることができなかった。早く忘れたい午後だった。" },
      { original: "Nicht auf dem Niveau, das man von ihm gewohnt ist. Verlor den Ball zu oft in gefährlichen Zonen und wirkte zunehmend frustriert über seine eigene Leistung. Die defensive Arbeit war in Ordnung, doch nach vorne fehlte es an Ideen und Durchsetzungskraft.", translated: "彼に慣れ親しんだレベルではなかった。危険なゾーンでのボールロストが多く、自身のパフォーマンスへのフラストレーションが増していった。守備面は問題なかったが、攻撃面ではアイデアと推進力を欠いた。" },
    ],
    ES: [
      { original: "Tuvo serias dificultades para entrar en el partido. La presión alta del rival le anuló y apenas pudo recibir balones en buenas condiciones. Cuando los tuvo, sus decisiones no fueron las mejores. Una tarde complicada que querrá olvidar cuanto antes.", translated: "試合に入るのに深刻な困難を抱えた。相手の高いプレスに封じられ、良い状態でボールを受けることがほとんどできなかった。ボールを持った時も判断が最善ではなかった。できるだけ早く忘れたい厳しい午後だった。" },
      { original: "Actuación decepcionante, muy por debajo de su nivel habitual. No encontró espacios ante una defensa bien organizada y cometió errores impropios de él. Su lenguaje corporal reflejó la frustración de un día en el que nada le salió como esperaba.", translated: "いつもの水準を大きく下回る期待外れのプレー。よく組織された守備の前でスペースを見つけられず、彼らしくないミスを犯した。何も思い通りにいかない日のフラストレーションがボディランゲージに表れていた。" },
    ],
    NL: [
      { original: "Moeizame middag waarin hij zijn draai niet kon vinden. Het hoge pressing van de tegenstander sneed zijn aanvoerlijnen af, waardoor hij nauwelijks invloed op het spel kon uitoefenen. Zijn baltoetsen waren onzuiver en hij slaagde er niet in om de kansen te creëren die zijn team nodig had.", translated: "リズムを掴めない苦しい午後だった。相手の高いプレスがボール供給を断ち、試合にほとんど影響を及ぼせなかった。ボールタッチが不正確で、チームが必要としていたチャンスを作ることができなかった。" },
      { original: "Teleurstellende prestatie die ver onder zijn gebruikelijke niveau lag. Kreeg weinig ruimte van een goed georganiseerde verdediging en maakte enkele onkarakteristieke fouten. De kwaliteit is er zonder twijfel, maar vandaag kwam die er simpelweg niet uit.", translated: "いつもの水準を大きく下回る期待外れのパフォーマンス。よく組織された守備から余裕を与えてもらえず、彼らしくないミスを犯した。クオリティがあるのは疑いないが、今日はそれが単純に発揮されなかった。" },
    ],
  },
};

// 現地の声テンプレート（パフォーマンス別）
interface VoiceTemplate {
  supporter: { original: string; translated: string }[];
  journalist: { original: string; translated: string }[];
}

const VOICE_TEMPLATES: Record<string, Record<string, VoiceTemplate>> = {
  // 英語（イングランド）
  EN: {
    excellent: {
      supporter: [
        { original: "{player} was absolutely brilliant today! What a performance against {opponent}.", translated: "{player}は今日絶対的に素晴らしかった！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Incredible display from {player}. {stat} He's been our best player this season.", translated: "{player}の信じられないプレー。{stat}今季最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} dominated the match against {opponent}. {stat} A truly world-class performance.", translated: "{player}が{opponent}戦を支配した。{stat}まさにワールドクラスのパフォーマンスだった。" },
        { original: "Outstanding from {player} today. {stat} The Japanese international continues to impress.", translated: "{player}の今日の傑出したプレー。{stat}この日本代表は印象を与え続けている。" },
      ],
    },
    good: {
      supporter: [
        { original: "Solid performance from {player} against {opponent}. {stat} Keep it up!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}この調子で！" },
        { original: "{player} did well today. {stat} Exactly what the team needed.", translated: "{player}は今日良くやった。{stat}まさにチームに必要なものだった。" },
      ],
      journalist: [
        { original: "{player} put in a composed performance against {opponent}. {stat}", translated: "{player}が{opponent}戦で落ち着いたパフォーマンスを見せた。{stat}" },
        { original: "Professional display from {player}. {stat} Continues to be a reliable presence.", translated: "{player}のプロフェッショナルなプレー。{stat}信頼できる存在であり続けている。" },
      ],
    },
    average: {
      supporter: [
        { original: "Quiet game from {player} today against {opponent}. {stat} Hopefully better next time.", translated: "{opponent}戦で{player}は静かな試合だった。{stat}次回に期待。" },
        { original: "{player} was okay but not his best. {stat}", translated: "{player}はまあまあだったが、ベストではなかった。{stat}" },
      ],
      journalist: [
        { original: "{player} had a mixed performance against {opponent}. {stat} Room for improvement.", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}改善の余地あり。" },
      ],
    },
    poor: {
      supporter: [
        { original: "Tough day for {player} against {opponent}. {stat} Not his day.", translated: "{opponent}戦で{player}にとって厳しい一日だった。{stat}彼の日ではなかった。" },
      ],
      journalist: [
        { original: "{player} struggled against {opponent}. {stat} Will need to bounce back.", translated: "{player}は{opponent}戦で苦戦した。{stat}立ち直る必要がある。" },
      ],
    },
  },
  // ドイツ語
  DE: {
    excellent: {
      supporter: [
        { original: "{player} war heute absolut herausragend! Was für eine Leistung gegen {opponent}.", translated: "{player}は今日絶対的に傑出していた！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Unglaubliche Vorstellung von {player}. {stat} Er ist unser bester Spieler.", translated: "{player}の信じられないプレー。{stat}彼は我々の最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} dominierte das Spiel gegen {opponent}. {stat} Eine Weltklasse-Leistung.", translated: "{player}が{opponent}戦を支配した。{stat}ワールドクラスのパフォーマンスだった。" },
      ],
    },
    good: {
      supporter: [
        { original: "Solide Leistung von {player} gegen {opponent}. {stat} Weiter so!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}この調子で！" },
      ],
      journalist: [
        { original: "{player} zeigte eine kontrollierte Leistung gegen {opponent}. {stat}", translated: "{player}が{opponent}戦でコントロールされたパフォーマンスを見せた。{stat}" },
      ],
    },
    average: {
      supporter: [
        { original: "Ruhiges Spiel von {player} heute gegen {opponent}. {stat}", translated: "{opponent}戦で{player}は静かな試合だった。{stat}" },
      ],
      journalist: [
        { original: "{player} hatte eine durchwachsene Leistung gegen {opponent}. {stat}", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}" },
      ],
    },
    poor: {
      supporter: [
        { original: "Schwieriger Tag für {player} gegen {opponent}. {stat}", translated: "{opponent}戦で{player}にとって難しい一日だった。{stat}" },
      ],
      journalist: [
        { original: "{player} hatte Probleme gegen {opponent}. {stat}", translated: "{player}は{opponent}戦で問題を抱えていた。{stat}" },
      ],
    },
  },
  // オランダ語
  NL: {
    excellent: {
      supporter: [
        { original: "{player} was vandaag absoluut briljant! Wat een prestatie tegen {opponent}.", translated: "{player}は今日絶対的に素晴らしかった！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Ongelooflijke wedstrijd van {player}. {stat} Hij is onze beste speler.", translated: "{player}の信じられない試合。{stat}彼は我々の最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} domineerde de wedstrijd tegen {opponent}. {stat} Wereldklasse.", translated: "{player}が{opponent}戦を支配した。{stat}ワールドクラスだ。" },
      ],
    },
    good: {
      supporter: [
        { original: "Solide prestatie van {player} tegen {opponent}. {stat} Goed gedaan!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}よくやった！" },
      ],
      journalist: [
        { original: "{player} liet een beheerste prestatie zien tegen {opponent}. {stat}", translated: "{player}が{opponent}戦でコントロールされたパフォーマンスを見せた。{stat}" },
      ],
    },
    average: {
      supporter: [
        { original: "Rustige wedstrijd van {player} vandaag tegen {opponent}. {stat}", translated: "{opponent}戦で{player}は静かな試合だった。{stat}" },
      ],
      journalist: [
        { original: "{player} had een wisselvallige prestatie tegen {opponent}. {stat}", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}" },
      ],
    },
    poor: {
      supporter: [
        { original: "Moeilijke dag voor {player} tegen {opponent}. {stat}", translated: "{opponent}戦で{player}にとって難しい一日だった。{stat}" },
      ],
      journalist: [
        { original: "{player} had moeite tegen {opponent}. {stat}", translated: "{player}は{opponent}戦で苦労した。{stat}" },
      ],
    },
  },
  // スペイン語
  ES: {
    excellent: {
      supporter: [
        { original: "¡{player} estuvo absolutamente brillante hoy! Qué actuación contra {opponent}.", translated: "{player}は今日絶対的に素晴らしかった！{opponent}戦でなんというパフォーマンスだ。" },
        { original: "Increíble partido de {player}. {stat} Es nuestro mejor jugador.", translated: "{player}の信じられない試合。{stat}彼は我々の最高の選手だ。" },
      ],
      journalist: [
        { original: "{player} dominó el partido contra {opponent}. {stat} Una actuación de clase mundial.", translated: "{player}が{opponent}戦を支配した。{stat}ワールドクラスのパフォーマンスだった。" },
      ],
    },
    good: {
      supporter: [
        { original: "Sólida actuación de {player} contra {opponent}. {stat} ¡Sigue así!", translated: "{opponent}戦で{player}の堅実なパフォーマンス。{stat}この調子で！" },
      ],
      journalist: [
        { original: "{player} mostró una actuación controlada contra {opponent}. {stat}", translated: "{player}が{opponent}戦でコントロールされたパフォーマンスを見せた。{stat}" },
      ],
    },
    average: {
      supporter: [
        { original: "Partido tranquilo de {player} hoy contra {opponent}. {stat}", translated: "{opponent}戦で{player}は静かな試合だった。{stat}" },
      ],
      journalist: [
        { original: "{player} tuvo una actuación irregular contra {opponent}. {stat}", translated: "{player}は{opponent}戦でムラのあるパフォーマンスだった。{stat}" },
      ],
    },
    poor: {
      supporter: [
        { original: "Día difícil para {player} contra {opponent}. {stat}", translated: "{opponent}戦で{player}にとって難しい一日だった。{stat}" },
      ],
      journalist: [
        { original: "{player} tuvo problemas contra {opponent}. {stat}", translated: "{player}は{opponent}戦で問題を抱えていた。{stat}" },
      ],
    },
  },
};

/**
 * パフォーマンスレベルを判定
 */
function getPerformanceLevel(match: Match): "excellent" | "good" | "average" | "poor" {
  const { goals, assists, minutesPlayed, rating } = match.playerStats;

  if (goals >= 2 || (goals >= 1 && assists >= 1) || rating >= 8.0) {
    return "excellent";
  }
  if (goals >= 1 || assists >= 1 || rating >= 7.0) {
    return "good";
  }
  if (rating >= 6.0 && minutesPlayed >= 60) {
    return "average";
  }
  return "poor";
}

/**
 * コメントの言語コードを取得
 */
function getCommentLanguage(sourceCountry: string): string {
  const countryToLang: Record<string, string> = {
    "イングランド": "EN",
    "スペイン": "ES",
    "ドイツ": "DE",
    "オランダ": "NL",
  };
  return countryToLang[sourceCountry] || "EN";
}

/**
 * 言語ごとに使用済みインデックスを追跡して重複しないコメントを返すジェネレータを作成
 */
function createCommentPicker(performanceLevel: string) {
  // 言語ごとの使用済みインデックスを管理
  const usedIndices: Record<string, Set<number>> = {};

  return (langCode: string): { comment: string; commentTranslated: string } | undefined => {
    const levelComments = MEDIA_COMMENT_TEMPLATES[performanceLevel];
    if (!levelComments) return undefined;

    const comments = levelComments[langCode] || levelComments["EN"];
    const effectiveLang = levelComments[langCode] ? langCode : "EN";
    if (!comments || comments.length === 0) return undefined;

    if (!usedIndices[effectiveLang]) {
      usedIndices[effectiveLang] = new Set();
    }
    const used = usedIndices[effectiveLang];

    // 全テンプレートを使い切った場合はリセット
    if (used.size >= comments.length) {
      used.clear();
    }

    // 未使用のインデックスからランダムに選択
    const available = Array.from({ length: comments.length }, (_, i) => i).filter(i => !used.has(i));
    const idx = available[Math.floor(Math.random() * available.length)];
    used.add(idx);

    const selected = comments[idx];
    return {
      comment: selected.original,
      commentTranslated: selected.translated,
    };
  };
}

/**
 * 試合結果に基づいてレーティングを生成
 */
function generateRatings(match: Match, player: Player): MediaRating[] {
  const country = player.league.country;
  const sources = MEDIA_SOURCES[country] || MEDIA_SOURCES["イングランド"];

  const performanceLevel = getPerformanceLevel(match);
  const baseRating = {
    excellent: 8.0,
    good: 7.0,
    average: 6.2,
    poor: 5.5,
  }[performanceLevel];

  // 試合単位でコメントピッカーを作成し、同一言語内の重複を防止
  const pickComment = createCommentPicker(performanceLevel);

  return sources.map((source) => {
    // 少しランダム性を持たせる
    const variance = (Math.random() - 0.5) * 0.6;
    const rating = Math.round((baseRating + variance) * 10) / 10;

    // コメントの言語を決定
    const langCode = getCommentLanguage(source.country);
    const commentData = pickComment(langCode);

    // kickerはドイツ式（6段階、低いほど良い）
    if (source.source === "kicker") {
      const kickerRating = Math.round((7 - rating / 1.5) * 10) / 10;
      return {
        source: source.source,
        country: source.country,
        rating: Math.max(1, Math.min(6, kickerRating)),
        maxRating: 6,
        ratingSystem: "german",
        comment: commentData?.comment,
        commentTranslated: commentData?.commentTranslated,
      };
    }

    return {
      source: source.source,
      country: source.country,
      rating: Math.max(4, Math.min(10, rating)),
      maxRating: 10,
      ratingSystem: "standard",
      comment: commentData?.comment,
      commentTranslated: commentData?.commentTranslated,
    };
  });
}

/**
 * 統計文字列を生成
 */
function generateStatString(match: Match): string {
  const stats: string[] = [];
  if (match.playerStats.goals > 0) {
    stats.push(`${match.playerStats.goals} goal${match.playerStats.goals > 1 ? "s" : ""}`);
  }
  if (match.playerStats.assists > 0) {
    stats.push(`${match.playerStats.assists} assist${match.playerStats.assists > 1 ? "s" : ""}`);
  }
  if (stats.length === 0 && match.playerStats.minutesPlayed > 0) {
    stats.push(`${match.playerStats.minutesPlayed} minutes played`);
  }
  return stats.join(", ");
}

/**
 * 現地の声を生成
 */
function generateLocalVoices(match: Match, player: Player): LocalVoice[] {
  const country = player.league.country;
  const langCode = COUNTRY_LANGUAGE[country] || "EN";
  const templates = VOICE_TEMPLATES[langCode] || VOICE_TEMPLATES["EN"];
  const performanceLevel = getPerformanceLevel(match);
  const levelTemplates = templates[performanceLevel];

  if (!levelTemplates) return [];

  const voices: LocalVoice[] = [];
  const opponent = match.homeTeam.name.includes(player.club.shortName)
    ? match.awayTeam.name
    : match.homeTeam.name;
  const statString = generateStatString(match);

  // サポーターの声
  if (levelTemplates.supporter.length > 0) {
    const template = levelTemplates.supporter[Math.floor(Math.random() * levelTemplates.supporter.length)];
    voices.push({
      id: `v${Date.now()}_1`,
      username: `@${player.club.shortName.replace(/\s/g, "")}Fan`,
      role: "サポーター",
      roleKey: "supporter",
      languageCode: langCode,
      originalText: template.original
        .replace("{player}", player.name.en)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString),
      translatedText: template.translated
        .replace("{player}", player.name.ja)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString ? `(${statString})` : ""),
    });
  }

  // ジャーナリストの声（notableな試合のみ）
  if (match.notable && levelTemplates.journalist.length > 0) {
    const template = levelTemplates.journalist[Math.floor(Math.random() * levelTemplates.journalist.length)];
    voices.push({
      id: `v${Date.now()}_2`,
      username: `@${country}FootballAnalyst`,
      role: "ジャーナリスト",
      roleKey: "journalist",
      languageCode: langCode,
      originalText: template.original
        .replace("{player}", player.name.en)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString),
      translatedText: template.translated
        .replace("{player}", player.name.ja)
        .replace("{opponent}", opponent)
        .replace("{stat}", statString ? `(${statString})` : ""),
    });
  }

  return voices;
}

// Xスレッドテンプレート
interface XThreadTemplate {
  type: "club" | "journalist" | "fan" | "analyst" | "japanese";
  username: string;
  verified: boolean;
  templates: {
    excellent: { original: string; translated: string }[];
    good: { original: string; translated: string }[];
    average: { original: string; translated: string }[];
    poor: { original: string; translated: string }[];
  };
}

interface XReplyTemplate {
  templates: {
    excellent: { original: string; translated: string }[];
    good: { original: string; translated: string }[];
    average: { original: string; translated: string }[];
    poor: { original: string; translated: string }[];
  };
}

const X_THREAD_TEMPLATES: XThreadTemplate[] = [
  {
    type: "club",
    username: "{clubName}",
    verified: true,
    templates: {
      excellent: [
        { original: "{playerEn} with {stat} against {opponent}! ⚽🔥 What a performance!", translated: "{playerJa}が{opponent}戦で{stat}！⚽🔥 素晴らしいパフォーマンス！" },
        { original: "🌟 {playerEn} shines bright! {stat} in today's match vs {opponent}. #MOTM", translated: "🌟 {playerJa}が輝く！{opponent}戦で{stat}。#マンオブザマッチ" },
      ],
      good: [
        { original: "{playerEn} puts in a solid shift against {opponent}. {stat} 💪", translated: "{playerJa}が{opponent}戦で堅実なプレー。{stat} 💪" },
        { original: "Another good display from {playerEn} today! {stat} vs {opponent}.", translated: "{playerJa}の今日も良いプレー！{opponent}戦で{stat}。" },
      ],
      average: [
        { original: "{playerEn} with {minutes} minutes against {opponent} today.", translated: "{playerJa}が{opponent}戦で{minutes}分間プレー。" },
        { original: "Full time: {playerEn} played his part in today's match vs {opponent}.", translated: "試合終了：{playerJa}が{opponent}戦に出場。" },
      ],
      poor: [
        { original: "{playerEn} featured against {opponent}. On to the next one. 💪", translated: "{playerJa}が{opponent}戦に出場。次に向けて。💪" },
      ],
    },
  },
  {
    type: "journalist",
    username: "{league}Reporter",
    verified: true,
    templates: {
      excellent: [
        { original: "🎯 {playerEn} was absolutely sensational today. {stat} against {opponent}. Japanese star continues to impress in {league}.", translated: "🎯 {playerJa}は今日絶対的にセンセーショナルだった。{opponent}戦で{stat}。日本のスターが{league}で印象を与え続けている。" },
        { original: "THREAD: Breaking down {playerEn}'s masterclass vs {opponent}. {stat} - here's why he was the difference maker today 🧵👇", translated: "スレッド：{opponent}戦での{playerJa}のマスタークラスを分析。{stat} - 今日の試合で彼が違いを生んだ理由はこれだ 🧵👇" },
      ],
      good: [
        { original: "{playerEn} showing why he's becoming a fan favorite. Solid display against {opponent}. {stat}", translated: "{playerJa}がファンのお気に入りになっている理由を示した。{opponent}戦で堅実なプレー。{stat}" },
        { original: "Watching {playerEn} develop in {league} has been a joy. Another composed performance vs {opponent}.", translated: "{league}での{playerJa}の成長を見るのは喜びだ。{opponent}戦でまた落ち着いたパフォーマンス。" },
      ],
      average: [
        { original: "{playerEn} with a quiet game against {opponent}. Not his best but showed glimpses of quality.", translated: "{playerJa}の{opponent}戦は静かな試合だった。ベストではないが質の高さを垣間見せた。" },
      ],
      poor: [
        { original: "Tough day for {playerEn} against {opponent}. Even the best have off days. Will bounce back.", translated: "{opponent}戦で{playerJa}には厳しい一日だった。最高の選手でも不調の日はある。巻き返すだろう。" },
      ],
    },
  },
  {
    type: "fan",
    username: "{clubShort}Supporter",
    verified: false,
    templates: {
      excellent: [
        { original: "I LOVE THIS MAN!!! {playerEn} YOU ABSOLUTE LEGEND!!! {stat} 🔥🔥🔥 #GOAT", translated: "この男が大好きだ！！！{playerJa}最高のレジェンド！！！{stat} 🔥🔥🔥 #史上最高" },
        { original: "{playerEn} just keeps getting better and better! {stat} against {opponent}! We're so lucky to have him! 🙌", translated: "{playerJa}はどんどん良くなっている！{opponent}戦で{stat}！彼がいて本当に幸運だ！🙌" },
        { original: "Best signing we've made in years. {playerEn} is different class. {stat} today. 🇯🇵👏", translated: "何年間で最高の補強だ。{playerJa}は別格。今日{stat}。🇯🇵👏" },
      ],
      good: [
        { original: "{playerEn} did his job again today. Reliable as always. 👍", translated: "{playerJa}は今日も仕事をした。相変わらず頼りになる。👍" },
        { original: "Solid game from {playerEn}! Love his work rate and attitude. 💙", translated: "{playerJa}の堅実な試合！彼の運動量と姿勢が好きだ。💙" },
      ],
      average: [
        { original: "{playerEn} wasn't at his best today but he never stops trying. That's what we love about him.", translated: "{playerJa}は今日ベストではなかったが、努力を止めない。それが彼の好きなところだ。" },
      ],
      poor: [
        { original: "Not {playerEn}'s day today but we all have those games. He'll be back stronger! 💪", translated: "今日は{playerJa}の日ではなかったが、誰にでもそういう試合はある。もっと強くなって帰ってくるだろう！💪" },
      ],
    },
  },
  {
    type: "analyst",
    username: "TacticsAnalyst",
    verified: true,
    templates: {
      excellent: [
        { original: "📊 {playerEn} vs {opponent} by numbers:\n• {stat}\n• 92% pass accuracy\n• 4 key passes\n• 3 successful dribbles\nWorld class.", translated: "📊 {playerJa}の{opponent}戦を数字で見る：\n• {stat}\n• パス成功率92%\n• キーパス4本\n• ドリブル成功3回\nワールドクラス。" },
        { original: "Heat map analysis: {playerEn} covered every blade of grass today. His off-the-ball movement was exceptional. {stat} 📈", translated: "ヒートマップ分析：{playerJa}は今日ピッチ全体をカバーした。ボールを持っていない時の動きが卓越していた。{stat} 📈" },
      ],
      good: [
        { original: "{playerEn}'s positioning today was excellent. Always making himself available. {stat} Good tactical awareness on display.", translated: "{playerJa}の今日のポジショニングは素晴らしかった。常に受ける位置を取っていた。{stat}良い戦術的意識を見せた。" },
      ],
      average: [
        { original: "{playerEn} had limited touches today ({minutes} mins) but his decision-making when on the ball was still sharp.", translated: "{playerJa}は今日タッチ数が限られていた（{minutes}分）が、ボールを持った時の判断は依然として鋭かった。" },
      ],
      poor: [
        { original: "Interesting tactical battle today. {playerEn} was well-marked by {opponent}'s defense. Sometimes that's just football.", translated: "今日は興味深い戦術的な戦いだった。{playerJa}は{opponent}の守備によくマークされた。サッカーとはそういうものだ。" },
      ],
    },
  },
  {
    type: "japanese",
    username: "日本サッカーファン",
    verified: false,
    templates: {
      excellent: [
        { original: "{playerJa}やばすぎる！！！{opponent}相手に{stat}！！これが日本の誇りだ！🇯🇵⚽", translated: "{playerJa}やばすぎる！！！{opponent}相手に{stat}！！これが日本の誇りだ！🇯🇵⚽" },
        { original: "今日の{playerJa}は神がかってた…{stat}とか冗談でしょ…🔥🔥", translated: "今日の{playerJa}は神がかってた…{stat}とか冗談でしょ…🔥🔥" },
        { original: "{playerJa}のプレー見てると朝から元気出る！{stat}！最高かよ！", translated: "{playerJa}のプレー見てると朝から元気出る！{stat}！最高かよ！" },
      ],
      good: [
        { original: "{playerJa}今日も安定してたね！{stat}でしっかり貢献👏", translated: "{playerJa}今日も安定してたね！{stat}でしっかり貢献👏" },
        { original: "海外で活躍する{playerJa}を見ると誇らしい気持ちになる🇯🇵", translated: "海外で活躍する{playerJa}を見ると誇らしい気持ちになる🇯🇵" },
      ],
      average: [
        { original: "{playerJa}今日はちょっと静かだったけど、守備は頑張ってた。次に期待！", translated: "{playerJa}今日はちょっと静かだったけど、守備は頑張ってた。次に期待！" },
      ],
      poor: [
        { original: "{playerJa}今日は苦しかったけど、こういう日もある。切り替えて次頑張れ！💪", translated: "{playerJa}今日は苦しかったけど、こういう日もある。切り替えて次頑張れ！💪" },
      ],
    },
  },
];

const X_REPLY_TEMPLATES: XReplyTemplate = {
  templates: {
    excellent: [
      { original: "What a player! {playerEn} is on fire! 🔥", translated: "なんという選手だ！{playerJa}が絶好調！🔥" },
      { original: "This guy is special. Glad he's on our team! 🙌", translated: "この選手は特別だ。チームにいて嬉しい！🙌" },
      { original: "MOTM easily. No debate needed.", translated: "文句なしのマンオブザマッチ。議論の余地なし。" },
      { original: "Japanese players really bringing quality to {league} 🇯🇵", translated: "日本人選手が本当に{league}にクオリティをもたらしている 🇯🇵" },
      { original: "Best performance I've seen from him! Incredible!", translated: "彼の最高のパフォーマンスを見た！信じられない！" },
      { original: "Give this man a new contract NOW! 📝", translated: "今すぐこの男に新契約を！📝" },
    ],
    good: [
      { original: "Solid as always. Love his consistency.", translated: "いつも通り堅実。彼の安定感が好きだ。" },
      { original: "Good game! Keep it up {playerEn}! 👏", translated: "良い試合！この調子で{playerJa}！👏" },
      { original: "Reliable performance. Exactly what we needed.", translated: "頼れるパフォーマンス。まさに必要としていたもの。" },
      { original: "He just does his job every week. Respect.", translated: "毎週仕事をこなす。リスペクト。" },
    ],
    average: [
      { original: "Not his best but still contributed. On to the next!", translated: "ベストではないが貢献した。次に向けて！" },
      { original: "Quiet game but these happen. He'll be back.", translated: "静かな試合だったが、こういうこともある。戻ってくるだろう。" },
      { original: "Need to see more from him but not worried.", translated: "もっと見たいが心配はしていない。" },
    ],
    poor: [
      { original: "Tough day. Everyone has them. Move on.", translated: "厳しい一日。誰にでもある。前に進もう。" },
      { original: "He'll bounce back. Quality players always do.", translated: "巻き返すだろう。質の高い選手は常にそうする。" },
      { original: "Not his day but still a great player.", translated: "彼の日ではなかったが、それでも素晴らしい選手だ。" },
    ],
  },
};

/**
 * Xスレッドを生成（全試合に対して生成）
 */
function generateXThreads(match: Match, player: Player): XThread[] {
  const opponent = match.homeTeam.name.includes(player.club.shortName)
    ? match.awayTeam.name
    : match.homeTeam.name;

  const performanceLevel = getPerformanceLevel(match);
  const statString = generateStatString(match) || "a strong showing";
  const langCode = COUNTRY_LANGUAGE[player.league.country] || "EN";

  const threads: XThread[] = [];
  const usedTemplateIndices = new Set<number>();

  // 5つのスレッドを生成
  for (let i = 0; i < 5; i++) {
    // 使用可能なテンプレートを選択
    let templateIndex: number;
    do {
      templateIndex = Math.floor(Math.random() * X_THREAD_TEMPLATES.length);
    } while (usedTemplateIndices.has(templateIndex) && usedTemplateIndices.size < X_THREAD_TEMPLATES.length);
    usedTemplateIndices.add(templateIndex);

    const threadTemplate = X_THREAD_TEMPLATES[templateIndex];
    const levelTemplates = threadTemplate.templates[performanceLevel];

    if (!levelTemplates || levelTemplates.length === 0) continue;

    const selectedTemplate = levelTemplates[Math.floor(Math.random() * levelTemplates.length)];

    // テンプレート変数を置換
    const replaceVars = (text: string): string => {
      return text
        .replace(/{playerEn}/g, player.name.en)
        .replace(/{playerJa}/g, player.name.ja)
        .replace(/{opponent}/g, opponent)
        .replace(/{stat}/g, statString)
        .replace(/{minutes}/g, String(match.playerStats.minutesPlayed))
        .replace(/{clubName}/g, player.club.name.replace(/\s/g, ""))
        .replace(/{clubShort}/g, player.club.shortName.replace(/\s/g, ""))
        .replace(/{league}/g, player.league.shortName);
    };

    const username = replaceVars(threadTemplate.username);

    // リプライを生成（2-4個）
    const replyCount = 2 + Math.floor(Math.random() * 3);
    const replies: XReply[] = [];
    const replyTemplates = X_REPLY_TEMPLATES.templates[performanceLevel];
    const usedReplyIndices = new Set<number>();

    for (let j = 0; j < replyCount && j < replyTemplates.length; j++) {
      let replyIndex: number;
      do {
        replyIndex = Math.floor(Math.random() * replyTemplates.length);
      } while (usedReplyIndices.has(replyIndex) && usedReplyIndices.size < replyTemplates.length);
      usedReplyIndices.add(replyIndex);

      const replyTemplate = replyTemplates[replyIndex];

      replies.push({
        id: `r${Date.now()}_${i}_${j}`,
        username: `@Fan_${Math.floor(Math.random() * 10000)}`,
        languageCode: Math.random() > 0.5 ? "EN" : "JA",
        originalText: replaceVars(replyTemplate.original),
        translatedText: replaceVars(replyTemplate.translated),
        likes: Math.floor(50 + Math.random() * 500),
      });
    }

    threads.push({
      id: `t${Date.now()}_${i}`,
      username: `@${username}`,
      verified: threadTemplate.verified,
      languageCode: threadTemplate.type === "japanese" ? "JA" : langCode,
      originalText: replaceVars(selectedTemplate.original),
      translatedText: replaceVars(selectedTemplate.translated),
      likes: Math.floor(1000 + Math.random() * 25000),
      retweets: Math.floor(200 + Math.random() * 5000),
      replies,
    });
  }

  return threads;
}

/**
 * メイン処理
 */
async function main(newMatchIds?: string[]) {
  console.log("=== コンテンツ自動生成スクリプト ===\n");

  // データファイルを読み込み
  const players: Player[] = JSON.parse(readFileSync(PLAYERS_FILE, "utf-8"));
  const matches: Match[] = JSON.parse(readFileSync(MATCHES_FILE, "utf-8"));
  const existingMediaRatings: MatchMediaData[] = JSON.parse(readFileSync(MEDIA_RATINGS_FILE, "utf-8"));

  // 既存データをMapで管理（matchId → MatchMediaData）
  const existingMap = new Map(existingMediaRatings.map((m) => [m.matchId, m]));

  // 処理対象の試合を決定
  const targetMatches = newMatchIds
    ? matches.filter((m) => newMatchIds.includes(m.matchId))
    : matches.filter((m) => !existingMap.has(m.matchId));

  if (targetMatches.length === 0) {
    console.log("コンテンツを生成する新しい試合がありません。");
    return;
  }

  console.log(`${targetMatches.length}件の試合に対してコンテンツを生成します...\n`);

  for (const match of targetMatches) {
    const player = players.find((p) => p.id === match.playerId);
    if (!player) {
      console.log(`[SKIP] 選手が見つかりません: ${match.playerId}`);
      continue;
    }

    console.log(`処理中: ${player.name.ja} - ${match.date} vs ${match.awayTeam.name}`);

    const existing = existingMap.get(match.matchId);

    // 既存の手動レーティングを保持（自動生成はしない）
    const manualRatings = existing
      ? existing.ratings.filter((r) => r.isManual === true)
      : [];

    // 平均レーティングを算出（手動レーティングのうちスコアがあるもの）
    const ratedManual = manualRatings.filter(
      (r) => r.hasArticleRating !== false && r.ratingSystem === "standard"
    );
    const averageRating = ratedManual.length > 0
      ? Math.round(
          (ratedManual.reduce((sum, r) => sum + r.rating, 0) / ratedManual.length) * 10
        ) / 10
      : match.playerStats.rating;

    // 既存の localVoices / xThreads があれば保持（手動追加分を保護）
    const existingVoices = existing?.localVoices || [];
    const existingThreads = existing?.xThreads || [];

    const mediaData: MatchMediaData = {
      matchId: match.matchId,
      playerId: match.playerId,
      ratings: manualRatings,
      averageRating,
      localVoices: existingVoices.length > 0 ? existingVoices : generateLocalVoices(match, player),
      xThreads: existingThreads.length > 0 ? existingThreads : generateXThreads(match, player),
      lastUpdated: new Date().toISOString(),
    };

    existingMap.set(match.matchId, mediaData);
    console.log(`  [生成完了] レーティング: ${averageRating} (手動: ${manualRatings.length})`);
  }

  // Mapから配列に戻して保存
  const allMediaData = Array.from(existingMap.values());
  writeFileSync(MEDIA_RATINGS_FILE, JSON.stringify(allMediaData, null, 2));
  console.log(`\n=== 完了: ${targetMatches.length}件の試合にコンテンツを生成しました ===`);
}

// コマンドライン引数から新規試合IDを取得（オプション）
const args = process.argv.slice(2);
const matchIds = args.length > 0 ? args : undefined;

main(matchIds).catch(console.error);

export { main as generateContent };
