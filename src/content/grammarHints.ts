export type GrammarHint = {
  pattern: string;
  zh: string;
  en: string;
  detailZh: string;
  detailEn: string;
};

// Only surface a pattern when its literal construction is present in the sentence.
// These are study prompts, not automatically verified sentence-level annotations.
const entries: {re: RegExp; pattern: string; zh: string; en: string; detailZh: string; detailEn: string}[] = [
  {re:/わけではな(?:い|く)/,pattern:'わけではない',zh:'并非……',en:'It is not necessarily the case',detailZh:'部分否定：否定前述判断，语气比直接否定缓和。',detailEn:'Partial negation of a statement.'},
  {re:/わけにはいかな(?:い|く)/,pattern:'わけにはいかない',zh:'不能……',en:'Cannot (for social or moral reasons)',detailZh:'表示受责任、常识或社会条件限制，不能采取某行动。',detailEn:'An action is not possible because of obligations or social norms.'},
  {re:/に違いな(?:い|く)/,pattern:'に違いない',zh:'一定……',en:'Must be / surely',detailZh:'根据已有依据作出把握较大的推断。',detailEn:'A strong inference based on available evidence.'},
  {re:/とは限らな(?:い|く)/,pattern:'とは限らない',zh:'不一定……',en:'Not necessarily',detailZh:'表示某一判断并非在所有情况下都成立。',detailEn:'A statement does not hold in all cases.'},
  {re:/に伴(?:って|い|う)/,pattern:'に伴って',zh:'随着……；伴随……',en:'Along with / as',detailZh:'两个变化或事件相互伴随。',detailEn:'One development accompanies another.'},
  {re:/につれ(?:て|、|\b)/,pattern:'につれて',zh:'随着……',en:'As / in proportion to',detailZh:'前项逐渐变化，后项随之变化。',detailEn:'One gradual change accompanies another.'},
  {re:/に応じ(?:て|た|る)/,pattern:'に応じて',zh:'根据……；按照……',en:'According to / depending on',detailZh:'根据条件、程度或需要采取相应措施。',detailEn:'Responding to a condition, level, or need.'},
  {re:/に基づ(?:いて|く|いた)/,pattern:'に基づいて',zh:'以……为依据',en:'Based on',detailZh:'说明某判断或行动的依据。',detailEn:'States the basis for a judgment or action.'},
  {re:/にかかわらず/,pattern:'にかかわらず',zh:'无论……',en:'Regardless of',detailZh:'表示前项条件如何，都不影响后项成立。',detailEn:'The result holds independently of the preceding condition.'},
  {re:/をめぐ(?:って|る|り)/,pattern:'をめぐって',zh:'围绕……',en:'Concerning / surrounding',detailZh:'经常用于争论、讨论、对立等话题。',detailEn:'Often used for debates, discussions, or disputes.'},
  {re:/にすぎな(?:い|く)/,pattern:'にすぎない',zh:'只不过……',en:'Merely / nothing more than',detailZh:'强调程度或范围有限。',detailEn:'Downplays the degree or scope of something.'},
  {re:/ざるを得な(?:い|く)/,pattern:'ざるを得ない',zh:'不得不……',en:'Have no choice but to',detailZh:'表示虽不情愿，但受客观条件所迫。',detailEn:'An unavoidable action despite reluctance.'},
  {re:/にほかならな(?:い|く)/,pattern:'にほかならない',zh:'正是……',en:'None other than',detailZh:'用来强调某事的本质或唯一原因。',detailEn:'Emphasizes identity or the essential cause.'},
  {re:/たところで/,pattern:'たところで',zh:'即使……也……',en:'Even if',detailZh:'表示即使做了前项，结果也未必改善。',detailEn:'A hypothetical action is unlikely to change the outcome.'},
  {re:/かねな(?:い|く)/,pattern:'かねない',zh:'有可能……（多为负面结果）',en:'Might well (undesirable result)',detailZh:'提示不希望发生的后果存在可能性。',detailEn:'Warns of a possible adverse result.'},
  {re:/ずにはいられな(?:い|く)/,pattern:'ずにはいられない',zh:'忍不住……',en:'Cannot help but',detailZh:'表示某种感情或行为难以抑制。',detailEn:'An irresistible emotion or action.'},
];

export function findGrammarHints(text: string): GrammarHint[] {
  return entries.filter(({re})=>re.test(text)).map(({pattern,zh,en,detailZh,detailEn})=>({pattern,zh,en,detailZh,detailEn}));
}
