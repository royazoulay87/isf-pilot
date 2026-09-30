// Run C — matched social scenarios (ISF 2026 pilot). Questionnaire items copied from CyberStatus_v2/web/items.js (SPIN, FPES, PHQ-9)
// and CyberStatus_v2/pilot_2026-09-27/items.js (NPI-16, BDI-II, B-PNI, LSAS, SoAS); scenario texts generated from settings_v15_2026-09-30.json (settings v15, 2026-09-30).
const ITEMS = {
  spin: { title: 'Please indicate how much the following problems have bothered you during the past week.',
    scale: ['Not at all','A little bit','Somewhat','Very much','Extremely'], values: [0,1,2,3,4],
    items: ['I am afraid of people in authority.','I am bothered by blushing in front of people.','Parties and social events scare me.','I avoid talking to people I don’t know.','Being criticized scares me a lot.','I avoid doing things or speaking to people for fear of embarrassment.','Sweating in front of people causes me distress.','I avoid going to parties.','I avoid activities in which I am the center of attention.','Talking to strangers scares me.','I avoid having to give speeches.','I would do anything to avoid being criticized.','Heart palpitations bother me when I am around people.','I am afraid of doing things when people might be watching.','Being embarrassed or looking stupid are among my worst fears.','I avoid speaking to anyone in authority.','Trembling or shaking in front of others is distressing to me.'] },
  fpes: { title: 'Read each of the following statements carefully and answer the degree to which you feel the statement is characteristic of you (0 = not at all true, 9 = very true).',
    scale: ['0','1','2','3','4','5','6','7','8','9'], values: [0,1,2,3,4,5,6,7,8,9],
    items: ['I am uncomfortable exhibiting my talents to others, even if I think my talents will impress them.','It would make me anxious to receive a compliment from someone that I am attracted to.','I try to choose clothes that will give people little impression of what I am like.','I feel uneasy when I receive praise from authority figures.','If I have something to say that I think a group will find interesting, I typically say it.','I would rather receive a compliment from someone when that person and I were alone than when in the presence of others.','If I was doing something well in front of others, I would wonder whether I was doing “too well”.','I generally feel uncomfortable when people give me compliments.','I don’t like to be noticed when I am in public places, even if I feel as though I am being admired.','I often feel under-appreciated, and wish people would comment more on my positive qualities.'] },
  phq9: { title: 'Over the last two weeks, how often have you been bothered by any of the following problems?',
    scale: ['Not at all','Several days','More than half the days','Nearly every day'], values: [0,1,2,3],
    items: ['Little interest or pleasure in doing things','Feeling down, depressed, or hopeless','Trouble falling or staying asleep, or sleeping too much','Feeling tired or having little energy','Poor appetite or overeating','Feeling bad about yourself — or that you are a failure or have let yourself or your family down','Trouble concentrating on things, such as reading the newspaper or watching television','Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual','Thoughts that you would be better off dead or of hurting yourself in some way'] },
  npi16: { title: 'Read each pair of statements below and select the one that comes closest to describing your feelings and beliefs about yourself. You may feel that neither statement describes you well, but pick the one that comes closest. Please complete all pairs.',
    // key = index (0 = left statement, 1 = right statement) of the narcissism-consistent statement (Ames et al., 2006); score = number of keyed choices, 0–16
    pairs: [['I really like to be the center of attention','It makes me uncomfortable to be the center of attention'],
            ['I am no better or no worse than most people','I think I am a special person'],
            ['Everybody likes to hear my stories','Sometimes I tell good stories'],
            ['I usually get the respect that I deserve','I insist upon getting the respect that is due me'],
            ['I don\'t mind following orders','I like having authority over people'],
            ['I am going to be a great person','I hope I am going to be successful'],
            ['People sometimes believe what I tell them','I can make anybody believe anything I want them to'],
            ['I expect a great deal from other people','I like to do things for other people'],
            ['I like to be the center of attention','I prefer to blend in with the crowd'],
            ['I am much like everybody else','I am an extraordinary person'],
            ['I always know what I am doing','Sometimes I am not sure of what I am doing'],
            ['I don\'t like it when I find myself manipulating people','I find it easy to manipulate people'],
            ['Being an authority doesn\'t mean that much to me','People always seem to recognize my authority'],
            ['I know that I am good because everybody keeps telling me so','When people compliment me I sometimes get embarrassed'],
            ['I try not to be a show off','I am apt to show off if I get the chance'],
            ['I am more capable than other people','There is a lot that I can learn from other people']],
    key: [0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0] },
  bdi: { title: 'This questionnaire consists of 20 groups of statements. Please read each group of statements carefully, and then pick out the one statement in each group that best describes the way you have been feeling during the past two weeks, including today. If several statements in a group seem to apply equally well, pick the one with the highest number. Be sure that you do not choose more than one statement for any group, including Item 15 (Changes in Sleeping Pattern) and Item 17 (Changes in Appetite).',
    groups: [["I do not feel sad.", "I feel sad much of the time.", "I am sad all the time.", "I am so sad or unhappy that I can't stand it."], ["I am not discouraged about my future.", "I feel more discouraged about my future than I used to be.", "I do not expect things to work out for me.", "I feel my future is hopeless and will only get worse."], ["I do not feel like a failure.", "I have failed more than I should have.", "As I look back, I see a lot of failures.", "I feel I am a total failure as a person."], ["I get as much pleasure as I ever did from the things I enjoy.", "I don't enjoy things as much as I used to.", "I get very little pleasure from the things that I used to enjoy.", "I can't get any pleasure from the things I used to enjoy."], ["I don't feel particularly guilty.", "I feel guilty over many things I have done or should have done.", "I feel quite guilty most of the time.", "I feel guilty all of the time."], ["I don't feel I am being punished.", "I feel I may be punished.", "I expect to be punished.", "I feel I am being punished."], ["I feel the same about myself as ever.", "I have lost confidence in myself.", "I am disappointed in myself.", "I dislike myself."], ["I don't criticize or blame myself more than usual.", "I am more critical of myself than I used to be.", "I criticize myself for all of my faults.", "I blame myself for everything bad that happens."], ["I don't cry anymore than I used to.", "I cry more than I used to.", "I cry over every little thing.", "I feel like crying, but I can't."], ["I am no more restless or wound up than usual.", "I feel more restless or wound up than usual.", "I am so restless or agitated that it's hard to stay still.", "I am so restless or agitated that I have to keep moving or doing something."], ["I have not lost interest in other people or activities.", "I am less interested in other people or things than before.", "I have lost most of my interest in other people or things.", "It's hard to get interested in anything."], ["I make decisions about as well as ever.", "I find it more difficult to make decisions than usual.", "I have much greater difficulty in making decisions than I used to.", "I have trouble making any decisions."], ["I do not feel I am worthless.", "I don't consider myself as worthwhile and useful as I used to.", "I feel more worthless as compared to other people.", "I feel utterly worthless."], ["I have as much energy as ever.", "I have less energy than I used to have.", "I don't have enough energy to do very much.", "I don't have enough energy to do anything."], ["I have not experienced any change in my sleeping pattern.", "I sleep somewhat more than usual.", "I sleep somewhat less than usual.", "I sleep a lot more than usual.", "I sleep a lot less than usual.", "I sleep most of the day.", "I wake up 1-2 hours early and can't get back to sleep."], ["I am no more irritable than usual.", "I am more irritable than usual.", "I am much more irritable than usual.", "I am irritable all the time."], ["I have not experienced any change in my appetite.", "My appetite is somewhat less than usual.", "My appetite is somewhat greater than usual.", "My appetite is much less than before.", "My appetite is much greater than usual.", "I have no appetite at all.", "I crave food all the time."], ["I can concentrate as well as ever.", "I can't concentrate as well as usual.", "It's hard to keep my mind on anything for very long.", "I find I can't concentrate on anything."], ["I am no more tired or fatigued than usual.", "I get more tired or fatigued more easily than usual.", "I am too tired or fatigued to do a lot of the things I used to do.", "I am too tired or fatigued to do most of the things I used to do."], ["I have not noticed any recent change in my interest in sex.", "I am less interested in sex than I used to be.", "I am much less interested in sex now.", "I have lost interest in sex completely."]],
    scores: [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 1, 2, 2, 3, 3], [0, 1, 2, 3], [0, 1, 1, 2, 2, 3, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]] },
  // Sense of Absence Scale (SoAS; Efrati & Potenza, 2026, Journal of Behavioral Addictions, 15(1), 230–244, doi 10.1556/2006.2025.00373), 14 items,
  // 1 = do not agree … 7 = agree very much; single factor; item wording from Table 2 of the paper.
  bpni: { title: 'A number of statements which people have used to describe themselves are given below. Read each statement and indicate how much it describes you (0 = not at all like me, 5 = very much like me).',
    scale: ['0','1','2','3','4','5'], values: [0,1,2,3,4,5],
    items: ['I can usually talk my way out of anything.','When people don’t notice me, I start to feel bad about myself.','I often hide my needs for fear that others will see me as needy and desperate.','I can make anyone believe anything I want them to.','I get annoyed by people who are not interested in what I say or do.','I find it easy to manipulate people.','Sometimes I avoid people because I’m concerned that they’ll disappoint me.','I typically get very angry when I’m unable to get what I want from others.','When others don’t meet my expectations, I often feel ashamed about what I wanted.','I feel important when others rely on me.','I can read people like a book.','Sacrificing for others makes me the better person.','I often fantasize about accomplishing things that are probably beyond my means.','Sometimes I avoid people because I’m afraid they won’t do what I want them to do.','It’s hard to show others the weaknesses I feel inside.','It’s hard to feel good about myself unless I know other people admire me.','I often fantasize about being rewarded for my efforts.','I am preoccupied with thoughts and concerns that most people are not interested in me.','I like to have friends who rely on me because it makes me feel important.','Sometimes I avoid people because I’m concerned they won’t acknowledge what I do for them.','It’s hard for me to feel good about myself unless I know other people like me.','It irritates me when people don’t notice how good a person I am.','I will never be satisfied until I get all that I deserve.','I try to show what a good person I am through my sacrifices.','I often fantasize about performing heroic deeds.','I often fantasize about being recognized for my accomplishments.','I can’t stand relying on other people because it makes me feel weak.','When others get a glimpse of my needs, I feel anxious and ashamed.'] },
  lsas: { title: 'The items below describe different situations. For each item, please rate the level of fear or anxiety you felt, and the frequency with which you avoided the situation, based on the past week (including today). If a situation did not happen during the last week, imagine what would happen if you were faced with it.',
    // administered as two plain matrices (Roy, 30.9): first fear/anxiety for all 24 situations, then avoidance for the same 24
    titleFear: 'The items below describe different situations. For each item, please rate the level of FEAR OR ANXIETY you felt in the situation during the past week (including today). If a situation did not happen during the last week, imagine what would happen if you were faced with it.',
    titleAvoid: 'Now, for the same situations, please rate HOW OFTEN you AVOIDED the situation during the past week (including today). If a situation did not happen during the last week, imagine what would happen if you were faced with it.',
    scaleA: ['None','Mild','Moderate','Severe'], scaleB: ['Never (0%)','Occasionally (1–33%)','Often (34–67%)','Usually (68–100%)'], values: [0,1,2,3],
    items: ['Telephoning in public.','Participating in small groups.','Eating in public places.','Drinking with others in public places.','Talking to people in authority.','Acting, performing or giving a talk in front of an audience.','Going to a party.','Working while being observed.','Writing while being observed.','Calling someone you don’t know very well.','Talking with people you don’t know very well.','Meeting strangers.','Urinating in a public bathroom.','Entering a room when others are already seated.','Being the center of attention.','Speaking up at a meeting.','Taking a test.','Expressing disagreement or disapproval to people you don’t know very well.','Looking at people you don’t know very well in the eyes.','Giving a report to a group.','Trying to pick up someone.','Returning goods to a store.','Giving a party.','Resisting a high pressure salesperson.'] },
  // State emotions (Roy, 29.9.2026, final list): eight PANAS items (Upset, Strong, Guilty, Proud, Ashamed, Active, Attentive, Afraid)
  // + Happy, Humiliated, Angry, Lonely, Sad (Sad added 30.9); PANAS "right now" instructions, 1–5. pa/na = indices of the positive / negative items.
  soas: { title: 'Please indicate how much you agree with each of the following statements.',
    scale: ['Do not agree 1','2','3','4','5','6','Agree very much 7'], values: [1,2,3,4,5,6,7],
    items: ['My heart aches, because it seems that no one truly loves me','Sometimes I think it would have been better if I didn\'t exist at all','At the end of the day, I feel like I\'ve wasted another day for nothing','I feel alone in the world, as if no one understands me','It\'s hard for me to feel loved or to love others, even though I try','Almost nothing interests me, everything seems boring','Even when I\'m with family and friends, I still feel lonely','It\'s hard for me to get up in the morning because I can\'t find a good reason','I struggle to remember the last time I truly felt happy or full of life','It\'s hard for me to find someone who truly understands me','I feel like I\'m watching my life from the outside, unable to truly participate','I feel like I don\'t belong anywhere, and it hurts','There\'s a hole in my heart that I can\'t fill, no matter what I do','I feel transparent, as if no one really sees me'] },
  // PHQ-9 kept for reference; not administered in the pilot (Roy, 29.9.2026: BDI-II instead).
};
const DESIGN = {
 "halves": {
  "H1": [
   "work_team",
   "q_yearend",
   "seminar",
   "volunteer",
   "sports",
   "cooking",
   "island",
   "q_birthday"
  ],
  "H2": [
   "q_promotion",
   "new_office",
   "q_class",
   "choir",
   "running",
   "residents",
   "q_dinner",
   "ten_friends"
  ]
 },
 "types": {
  "A_workplace": [
   "work_team",
   "q_yearend",
   "q_promotion",
   "new_office"
  ],
  "B_structured": [
   "seminar",
   "volunteer",
   "q_class",
   "choir"
  ],
  "C_peer_leisure": [
   "sports",
   "cooking",
   "running",
   "residents"
  ],
  "D_friends": [
   "q_dinner",
   "island",
   "ten_friends",
   "q_birthday"
  ]
 },
 "blockOrder": "traits -> ambiguous block (8) -> clear block (8) -> demographics/attention/debrief",
 "textVersion": "v15"
};
const SCENARIOS = [
 {
  "id": "work_team",
  "name": "Work team",
  "groupType": "group",
  "acceptFirst": true,
  "setup": "You have recently joined a project team at work. At the end of the first month, the team meets to review each member's contribution, to decide who does what next, and to form the pairs that will work together.",
  "setup2": "You have recently joined a task force at work that meets every Friday. After six weeks, the team lead goes round the table to sum up what each member has brought so far, and the members set up the two-person sub-teams for the next phase.",
  "alt": {
   "setup": "You have recently joined a task force at work that meets every Friday. After six weeks, the team lead goes round the table to sum up what each member has brought so far, and the members set up the two-person sub-teams for the next phase.",
   "sH": "Your input is summed up as among the strongest, and you are asked to coordinate the next phase.",
   "sL": "Your input is summed up as among the weakest, and you are given a supporting task in the next phase.",
   "aH": "When the sub-teams are set up, several members say they would like to be in a sub-team with you and put their names next to yours.",
   "aL": "When the sub-teams are set up, several members say they would rather not be in a sub-team with you, and nobody puts their name next to yours."
  },
  "alt_mild": {
   "setup": "You have recently joined a project team at a new job. At the end of the second month, the team meets to go over each member's contribution, to decide who does what next, and to form the pairs that will work together.",
   "sH": "Your contribution is rated among the best, and you are asked to lead the next stage.",
   "sL": "Your contribution is rated among the weakest, and you are given a minor role in the next stage.",
   "aH": "When the pairs are formed, several members say they would enjoy working with you and ask to pair up with you.",
   "aL": "When the pairs are formed, several members say they would rather not spend the next stage working with you, and nobody asks to pair up with you."
  },
  "no": 1,
  "sH": "Your contribution is rated among the best, and you are asked to lead the next stage of the project.",
  "sL": "Your contribution is rated among the weakest, and you are given a minor role in the next stage of the project.",
  "aH": "When the pairs are formed, several members say they would enjoy working with you and ask to pair up with you.",
  "aL": "When the pairs are formed, several members say they would rather not spend the next stage working with you, and nobody asks to pair up with you.",
  "amb": {
   "A": {
    "high": "You have recently joined a project team at work. At the end of the first month, the team meets to review each member's contribution, to decide who does what next, and to form the pairs that will work together. When the pairs are formed, several members say they would enjoy working with you and ask to pair up with you. When your contribution comes up, the team agrees that your approach stood out, but moves on without explaining how.",
    "low": "You have recently joined a project team at work. At the end of the first month, the team meets to review each member's contribution, to decide who does what next, and to form the pairs that will work together. When the pairs are formed, several members say they would rather not spend the next stage working with you, and nobody asks to pair up with you. When your contribution comes up, the team agrees that your approach stood out, but moves on without explaining how."
   },
   "B": {
    "high": "You have recently joined a project team at work. At the end of the first month, the team meets to review each member's contribution, to decide who does what next, and to form the pairs that will work together. Your contribution is rated among the best. When the pairs are formed, several members exchange a glance and go on talking to each other about who will work with whom.",
    "low": "You have recently joined a project team at work. At the end of the first month, the team meets to review each member's contribution, to decide who does what next, and to form the pairs that will work together. Your contribution is rated among the weakest. When the pairs are formed, several members exchange a glance and go on talking to each other about who will work with whom."
   }
  },
  "cogA": [
   "they think my approach made my contribution weaker.",
   "they noticed that my approach was different, without judging its quality.",
   "they think my approach made my contribution stronger."
  ],
  "cogB": [
   "they do not want to work with me.",
   "they are just sorting out the pairs; it has nothing to do with me.",
   "they are about to ask me to work with them."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this team?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this team?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay on this team, and I would keep giving it my all."
    ],
    [
     "stay_wait",
     "I would stay on the team for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would ask to move to another team as soon as I could."
    ],
    [
     "submit",
     "I would not express my own view, and I would go along with whatever the other members of the team decide."
    ],
    [
     "status_up",
     "I would put extra effort into my next task to prove to the team what I am capable of."
    ],
    [
     "belittle",
     "I would make sure the team sees where the others fall short, so they learn a lesson."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other members, for example by joining them for lunch."
    ]
   ]
  }
 },
 {
  "id": "seminar",
  "name": "Seminar",
  "groupType": "group",
  "acceptFirst": true,
  "setup": "You are taking a course that meets once a week as a small seminar group. Today it is your turn to present your work, and the lecturer will also assign the pairs for the next session.",
  "setup2": "You are taking an evening workshop that meets once a week in a group of ten. Tonight you present the draft of your project, and the tutor will also put people into pairs for the peer-review round.",
  "alt": {
   "setup": "You are taking an evening workshop that meets once a week in a group of ten. Tonight you present the draft of your project, and the tutor will also put people into pairs for the peer-review round.",
   "sH": "After your presentation, the tutor says that it was among the strongest drafts she has seen in the workshop, and the group claps.",
   "sL": "After your presentation, the tutor says that it was among the weakest drafts she has seen in the workshop, and nobody says anything.",
   "aH": "When the tutor puts people into pairs and reaches your name, she says that pairing you is easy, because everyone finds you pleasant to work with.",
   "aL": "When the tutor puts people into pairs and reaches your name, she says that she will need to come back to you, because people do not find you easy to work with."
  },
  "alt_mild": {
   "setup": "You are taking a second course that meets every Tuesday as a small seminar group. Today it is your turn to present, and the lecturer will also assign the pairs for next week.",
   "sH": "After your presentation, the lecturer says that it was one of the best presentations the course has had, and the group applauds.",
   "sL": "After your presentation, the lecturer says that it was one of the weakest presentations the course has had, and there is an awkward silence.",
   "aH": "When the lecturer assigns the pairs and gets to you, he remarks that it is easy to find you a partner, because you are the type that is easy to work with.",
   "aL": "When the lecturer assigns the pairs and gets to you, he remarks that he will have to think about it, because you are not the type that is easy to work with."
  },
  "no": 2,
  "sH": "After your presentation, the lecturer says that it was one of the best presentations the course has had, and the group applauds.",
  "sL": "After your presentation, the lecturer says that it was one of the weakest presentations the course has had, and there is an awkward silence.",
  "aH": "When the lecturer assigns the pairs and gets to you, he remarks that it is easy to find you a partner, because you are the type that is easy to work with.",
  "aL": "When the lecturer assigns the pairs and gets to you, he remarks that he will have to think about it, because you are not the type that is easy to work with.",
  "amb": {
   "A": {
    "high": "You are taking a course that meets once a week as a small seminar group. Today it is your turn to present your work, and the lecturer will also assign the pairs for the next session. When the lecturer assigns the pairs and gets to you, he remarks that it is easy to find you a partner, because you are the type that is easy to work with. After your presentation, the lecturer says only \"Interesting, thank you very much\" and moves on.",
    "low": "You are taking a course that meets once a week as a small seminar group. Today it is your turn to present your work, and the lecturer will also assign the pairs for the next session. When the lecturer assigns the pairs and gets to you, he remarks that he will have to think about it, because you are not the type that is easy to work with. After your presentation, the lecturer says only \"Interesting, thank you very much\" and moves on."
   },
   "B": {
    "high": "You are taking a course that meets once a week as a small seminar group. Today it is your turn to present your work, and the lecturer will also assign the pairs for the next session. After your presentation, the lecturer says that it was one of the best presentations the course has had. When the lecturer assigns the pairs and gets to you, he pauses, says \"let me come back to you\", and moves on to the next name.",
    "low": "You are taking a course that meets once a week as a small seminar group. Today it is your turn to present your work, and the lecturer will also assign the pairs for the next session. After your presentation, the lecturer says that it was one of the weakest presentations the course has had. When the lecturer assigns the pairs and gets to you, he pauses, says \"let me come back to you\", and moves on to the next name."
   }
  },
  "cogA": [
   "the lecturer thought it was one of the weaker presentations.",
   "the lecturer was short of time; it says nothing about my work.",
   "the lecturer thought it was one of the better presentations."
  ],
  "cogB": [
   "the lecturer finds it hard to place me because I am not easy to work with.",
   "the lecturer simply has not finished the pairs; it says nothing about me.",
   "the lecturer wants to find me a particularly good partner."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that the lecturer values your work?"
    ],
    [
     "wanted",
     "How likely is it that the lecturer wants you in the seminar?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in this seminar group, and I would keep coming no matter what."
    ],
    [
     "stay_wait",
     "I would keep coming for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would switch to another seminar group, or drop the course, as soon as I could."
    ],
    [
     "submit",
     "I would keep quiet and avoid drawing attention to myself."
    ],
    [
     "status_up",
     "I would prepare my next presentation so well that the lecturer could not doubt my abilities."
    ],
    [
     "belittle",
     "I would point out flaws in the lecturer's arguments in front of the group, so that he understands who he is dealing with."
    ],
    [
     "approach",
     "I would make an effort to get closer to the lecturer, for example by starting an informal conversation with him after the seminar."
    ]
   ]
  }
 },
 {
  "id": "volunteer",
  "name": "Volunteer group",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "You have started volunteering with a local community project that meets twice a week. After the first month, the coordinator takes you aside for a short talk about how things are going.",
  "setup2": "You have started helping out at a charity shop two afternoons a week. After the first month, the manager asks you to stay behind for a few minutes to talk about how it is going.",
  "alt": {
   "setup": "You have started helping out at a charity shop two afternoons a week. After the first month, the manager asks you to stay behind for a few minutes to talk about how it is going.",
   "sH": "The manager says that you have been doing an excellent job and that you get more done than any of the other helpers.",
   "sL": "The manager says that your work has been poor and that you get less done than any of the other helpers.",
   "aH": "The manager adds that the other helpers are very fond of you and are glad when you are on the rota with them.",
   "aL": "The manager adds that there seems to be some friction between you and the others, and that they are not comfortable when you are on the rota with them."
  },
  "alt_mild": {
   "setup": "You have started volunteering with a community project in another part of town that meets twice a week. After the first six weeks, the coordinator takes you aside for a short chat about how things are going.",
   "sH": "The coordinator tells you that your work has been excellent and that you contribute more than anyone else in the group.",
   "sL": "The coordinator tells you that your work has been weak and that you contribute less than anyone else in the group.",
   "aH": "The coordinator adds that the other volunteers like you very much and enjoy having you around.",
   "aL": "The coordinator adds that there seems to be a problem between you and the group, and that the other volunteers do not feel comfortable around you."
  },
  "no": 3,
  "sH": "The coordinator tells you that your work has been excellent and that you contribute more than anyone else in the group.",
  "sL": "The coordinator tells you that your work has been weak and that you contribute less than anyone else in the group.",
  "aH": "The coordinator adds that the other volunteers like you very much and enjoy having you around.",
  "aL": "The coordinator adds that there seems to be a problem between you and the group, and that the other volunteers do not feel comfortable around you.",
  "amb": {
   "A": {
    "high": "You have started volunteering with a local community project that meets twice a week. After the first month, the coordinator takes you aside for a short talk about how things are going. The coordinator tells you that the other volunteers like you very much and enjoy having you around. About your contribution, the coordinator says, \"Your work has certainly attracted attention,\" without elaborating.",
    "low": "You have started volunteering with a local community project that meets twice a week. After the first month, the coordinator takes you aside for a short talk about how things are going. The coordinator tells you that there seems to be a problem between you and the group, and the other volunteers do not feel comfortable around you. About your contribution, the coordinator says, \"Your work has certainly attracted attention,\" without elaborating."
   },
   "B": {
    "high": "You have started volunteering with a local community project that meets twice a week. After the first month, the coordinator takes you aside for a short talk about how things are going. The coordinator tells you that your work has been excellent and that you contribute more than anyone else in the group. About how the others feel about you, the coordinator says, \"They have had a few things to say about having you around,\" without explaining further.",
    "low": "You have started volunteering with a local community project that meets twice a week. After the first month, the coordinator takes you aside for a short talk about how things are going. The coordinator tells you that your work has been weak and that you contribute less than anyone else in the group. About how the others feel about you, the coordinator says, \"They have had a few things to say about having you around,\" without explaining further."
   }
  },
  "cogA": [
   "the attention comes from weak work.",
   "the attention is about the kind of work I have been doing, not about its quality.",
   "the attention comes from good work."
  ],
  "cogB": [
   "they do not enjoy my company.",
   "they talked about practical things to do with having a new person around, not about liking or disliking me.",
   "they enjoy my company."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this volunteer group?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this volunteer group?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay with this project, and I would keep coming every week."
    ],
    [
     "stay_wait",
     "I would keep coming for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would stop volunteering with this project as soon as I could."
    ],
    [
     "submit",
     "I would keep a low profile and do what I am told."
    ],
    [
     "status_up",
     "I would throw myself into the next event and prove to the coordinator and the others what I am worth."
    ],
    [
     "belittle",
     "I would let the coordinator know where the other volunteers fall short, so that they understand that they are the problem, not me."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other volunteers, for example by asking whether anyone needs a hand."
    ]
   ]
  }
 },
 {
  "id": "residents",
  "name": "Neighbourhood residents' group",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "You have joined a residents' group in your area that is organising a local street event, a complex event that requires a great deal of responsibility. After the first few meetings, the group decides who will do what.",
  "setup2": "You have joined the tenants' committee of your building, which is organising a big summer party for all the residents, an event that needs a lot of planning. After a few meetings, the committee decides who takes which job.",
  "alt": {
   "setup": "You have joined the tenants' committee of your building, which is organising a big summer party for all the residents, an event that needs a lot of planning. After a few meetings, the committee decides who takes which job.",
   "sH": "During the discussion, when your name comes up, someone proposes that you run the whole event, and everyone agrees.",
   "sL": "During the discussion, when your name comes up, someone proposes that you hand out drinks on the day, without any responsibility, and everyone agrees.",
   "aH": "Someone else adds that it is a pleasure having you on the committee, and everyone agrees.",
   "aL": "Someone else adds that the others do not much enjoy your company, and the group agrees."
  },
  "alt_mild": {
   "setup": "You have joined a residents' group in your area that is organising a neighbourhood festival, a complex event that requires a great deal of responsibility. After the first few meetings, the group decides who will do what.",
   "sH": "During the discussion, when your name comes up, someone suggests that you should be the chief organiser of the event, and everyone agrees.",
   "sL": "During the discussion, when your name comes up, someone suggests that you help out at one of the stalls, without being in charge of anything, and everyone agrees.",
   "aH": "Someone else adds that they are glad you are part of the group, and everyone agrees.",
   "aL": "Someone else says that the others do not enjoy having you around socially, and the group agrees."
  },
  "no": 4,
  "sH": "During the discussion, when your name comes up, someone suggests that you should be the chief organiser of the event, and everyone agrees.",
  "sL": "During the discussion, when your name comes up, someone suggests that you help out at one of the stalls, without being in charge of anything, and everyone agrees.",
  "aH": "Someone else adds that they are glad you are part of the group, and everyone agrees.",
  "aL": "Someone else says that the others do not enjoy having you around socially, and the group agrees.",
  "amb": {
   "A": {
    "high": "You have joined a residents' group in your area that is organising a local street event, a complex event that requires a great deal of responsibility. After the first few meetings, the group decides who will do what. During the discussion, someone says that they are glad you are part of the group, and everyone agrees. When the group discusses who should organise the event, someone mentions your name. Several members exchange looks before the discussion continues.",
    "low": "You have joined a residents' group in your area that is organising a local street event, a complex event that requires a great deal of responsibility. After the first few meetings, the group decides who will do what. During the discussion, someone says that the others do not enjoy having you around socially, and the group agrees. When the group discusses who should organise the event, someone mentions your name. Several members exchange looks before the discussion continues."
   },
   "B": {
    "high": "You have joined a residents' group in your area that is organising a local street event, a complex event that requires a great deal of responsibility. After the first few meetings, the group decides who will do what. During the discussion, when your name comes up, someone suggests that you should be the chief organiser of the event, and everyone agrees. Later, someone starts to say something about how you are getting on in the group socially, then stops and changes the subject.",
    "low": "You have joined a residents' group in your area that is organising a local street event, a complex event that requires a great deal of responsibility. After the first few meetings, the group decides who will do what. During the discussion, when your name comes up, someone suggests that you help out at one of the stalls, without being in charge of anything, and everyone agrees. Later, someone starts to say something about how you are getting on in the group socially, then stops and changes the subject."
   }
  },
  "cogA": [
   "they doubt my ability.",
   "they are weighing the options; the looks are about the decision, not about me.",
   "they see me as a suitable candidate."
  ],
  "cogB": [
   "they do not enjoy having me around socially.",
   "the conversation moved on before the person finished; I cannot tell what they meant.",
   "they enjoy having me around socially."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this residents' group?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this residents' group?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in the residents' group, and I would keep coming to the meetings no matter what."
    ],
    [
     "stay_wait",
     "I would keep coming to the meetings for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would leave the residents' group as soon as I could."
    ],
    [
     "submit",
     "I would keep my head down, not draw fire, and go along with whatever happens."
    ],
    [
     "status_up",
     "I would take on more than anyone else at the event and show them all what I can do."
    ],
    [
     "belittle",
     "I would show the group how little the others have actually done, so they understand who they are dealing with."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other residents, for example by striking up a friendly chat with a few of them."
    ]
   ]
  }
 },
 {
  "id": "sports",
  "name": "Amateur sports team",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "You have joined an amateur sports team that plays in a local league once a week. After the first few games, the coach presents each player's statistics to the team.",
  "setup2": "You have joined a five-a-side team that plays every Wednesday evening. After the first month, the captain goes through everyone's numbers with the team.",
  "alt": {
   "setup": "You have joined a five-a-side team that plays every Wednesday evening. After the first month, the captain goes through everyone's numbers with the team.",
   "sH": "You have the best numbers on the team and have scored more goals than anyone.",
   "sL": "You have the worst numbers on the team and have scored fewer goals than anyone.",
   "aH": "Right afterwards, in front of everyone, the captain turns to you and says that you are a real team player, and that everyone should take note.",
   "aL": "Right afterwards, in front of everyone, the captain turns to you and says that, so far, you have not learned how to be part of a team, and that everyone should take note."
  },
  "alt_mild": {
   "setup": "You have joined an amateur sports team that plays in a regional league every weekend. After the first few games, the coach presents each player's statistics to the team.",
   "sH": "You lead the team in efficiency and are its top scorer.",
   "sL": "You are the least efficient player on the team and have scored the fewest goals.",
   "aH": "Right afterwards, in front of the whole team, the coach turns to you and says that you are simply a great team member, and that it is important to notice that.",
   "aL": "Right afterwards, in front of the whole team, the coach turns to you and says that, at the moment, you still do not know how to be a team member, and that it is important to be aware of that."
  },
  "no": 5,
  "sH": "You lead the team in efficiency and are its top scorer.",
  "sL": "You are the least efficient player on the team and have scored the fewest goals.",
  "aH": "Right afterwards, in front of the whole team, the coach turns to you and says that you are simply a great team member, and that it is important to notice that.",
  "aL": "Right afterwards, in front of the whole team, the coach turns to you and says that, at the moment, you still do not know how to be a team member, and that it is important to be aware of that.",
  "amb": {
   "A": {
    "high": "You have joined an amateur sports team that plays in a local league once a week. After the first few games, the coach talks to the team about how things are going. In front of the whole team, he turns to you and says that you are simply a great team member, and that it is important to notice that. After the game, the coach says, \"Your performance gave me something to think about,\" without explaining further.",
    "low": "You have joined an amateur sports team that plays in a local league once a week. After the first few games, the coach talks to the team about how things are going. In front of the whole team, he turns to you and says that, at the moment, you still do not know how to be a team member, and that it is important to be aware of that. After the game, the coach says, \"Your performance gave me something to think about,\" without explaining further."
   },
   "B": {
    "high": "You have joined an amateur sports team that plays in a local league once a week. After the first few games, the coach presents each player's statistics to the team. You lead the team in efficiency and are its top scorer. The coach starts to tell you how the other players feel about having you around, then stops and moves on.",
    "low": "You have joined an amateur sports team that plays in a local league once a week. After the first few games, the coach presents each player's statistics to the team. You are the least efficient player on the team and have scored the fewest goals. The coach starts to tell you how the other players feel about having you around, then stops and moves on."
   }
  },
  "cogA": [
   "the coach noticed weaknesses in my game.",
   "the coach is still working out how to rate my performance.",
   "the coach noticed real ability."
  ],
  "cogB": [
   "the other players do not enjoy my company.",
   "he was cut short by the next item on the agenda; the stop was not about me.",
   "the other players enjoy my company."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this team?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this team?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay on this team, and I would keep showing up every week."
    ],
    [
     "stay_wait",
     "I would keep playing for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would leave the team as soon as I could."
    ],
    [
     "submit",
     "I would make myself invisible, so as not to draw any more attention."
    ],
    [
     "status_up",
     "I would train harder than anyone and prove on the pitch what I am worth."
    ],
    [
     "belittle",
     "I would make sure everyone notices the other players' mistakes, because what they did to me was not fair."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other players, for example by helping one of them train on something he is working on."
    ]
   ]
  }
 },
 {
  "id": "cooking",
  "name": "Evening cooking class",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "You have signed up for an evening cooking class that meets once a week. At the end of the session, you overhear two classmates talking about you and your dish.",
  "setup2": "You have signed up for a weekend pasta-making workshop. As the group tastes each other's dishes at the end, you overhear two participants talking about you and your plate.",
  "alt": {
   "setup": "You have signed up for a weekend pasta-making workshop. As the group tastes each other's dishes at the end, you overhear two participants talking about you and your plate.",
   "sH": "They say that your plate was easily the best of the day and that you obviously have a real gift for cooking.",
   "sL": "They say that your plate was easily the worst of the day and that you obviously have no gift for cooking.",
   "aH": "They also say that you are lovely and that they really warmed to you.",
   "aL": "They also say that you are insufferable and that they found it really unpleasant being around you."
  },
  "alt_mild": {
   "setup": "You have signed up for an evening baking class that meets once a week. At the end of the session, you overhear two classmates talking about you and your cake.",
   "sH": "They say that your cake is easily one of the best in the class and that you clearly have a talent for baking.",
   "sL": "They say that your cake is easily one of the worst in the class and that you clearly have little talent for baking.",
   "aH": "They also say that you are so nice and that they really like you.",
   "aL": "They also say that you are unbearable and that it is really unpleasant to be around you."
  },
  "no": 6,
  "sH": "They say that your dish is easily one of the best in the class and that you clearly have a talent for cooking.",
  "sL": "They say that your dish is easily one of the worst in the class and that you clearly have little talent for cooking.",
  "aH": "They also say that you are so nice and that they really like you.",
  "aL": "They also say that you are unbearable and that it is really unpleasant to be around you.",
  "amb": {
   "A": {
    "high": "You have signed up for an evening cooking class that meets once a week. At the end of the session, you overhear two classmates talking about you: they say that you are so nice and that they really like you. About your dish, they say, \"That was an unexpected choice,\" without explaining further.",
    "low": "You have signed up for an evening cooking class that meets once a week. At the end of the session, you overhear two classmates talking about you: they say that you are unbearable and that it is really unpleasant to be around you. About your dish, they say, \"That was an unexpected choice,\" without explaining further."
   },
   "B": {
    "high": "You have signed up for an evening cooking class that meets once a week. At the end of the session, you overhear two classmates talking about your dish: they say that it is easily one of the best in the class and that you clearly have a talent for cooking. About you, they say only that you are \"quite a character\", and move on to something else.",
    "low": "You have signed up for an evening cooking class that meets once a week. At the end of the session, you overhear two classmates talking about your dish: they say that it is easily one of the worst in the class and that you clearly have little talent for cooking. About you, they say only that you are \"quite a character\", and move on to something else."
   }
  },
  "cogA": [
   "the choice spoiled the dish.",
   "the choice was unusual, without a clear evaluation.",
   "the choice was successful and creative."
  ],
  "cogB": [
   "they meant that I am unbearable to be around.",
   "it was a throwaway remark; it says nothing about how they feel about me.",
   "they meant that they like me."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this class?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this class?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in this class, and I would keep coming no matter what."
    ],
    [
     "stay_wait",
     "I would keep coming for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would drop the class as soon as I could."
    ],
    [
     "submit",
     "I would try not to make too much noise, in class or otherwise, and go along with everyone in everything."
    ],
    [
     "status_up",
     "I would bring a dish next week that would leave no doubt about what I can do."
    ],
    [
     "belittle",
     "I would point out what is wrong with those classmates' dishes, so that they understand exactly where they stand."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other participants, for example by suggesting that we sit down and talk during the break."
    ]
   ]
  }
 },
 {
  "id": "choir",
  "name": "Community choir",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "You have joined a community choir that rehearses once a week. After the first month, the choir director hands out the parts for the next concert.",
  "setup2": "You have joined an amateur band that rehearses on Thursday nights. After the first month, the band leader decides who sings which parts at the next gig.",
  "alt": {
   "setup": "You have joined an amateur band that rehearses on Thursday nights. After the first month, the band leader decides who sings which parts at the next gig.",
   "sH": "You are given the lead vocal on three songs, while most members get no lead at all.",
   "sL": "You are not given a lead vocal on any song, while most members get several.",
   "aH": "He adds that, on the personal side, he is really happy you joined, and everyone nods.",
   "aL": "He adds that, on the personal side, to be honest, having you around is not always easy, and several members nod."
  },
  "alt_mild": {
   "setup": "You have joined a community choir in a nearby town that rehearses once a week. After the first month, the choir director hands out the parts for the spring concert.",
   "sH": "You are given three solos, while most members get none.",
   "sL": "You are not given a solo, while most members get several.",
   "aH": "He adds that, socially, he is really glad you are part of this group, and everyone nods.",
   "aL": "He adds that, socially, to be honest, it is not always easy having you in this group, and several members nod."
  },
  "no": 7,
  "sH": "You are given three solos, while most members get none.",
  "sL": "You are not given a solo, while most members get several.",
  "aH": "He adds that, socially, he is really glad you are part of this group, and everyone nods.",
  "aL": "He adds that, socially, to be honest, it is not always easy having you in this group, and several members nod.",
  "amb": {
   "A": {
    "high": "You have joined a community choir that rehearses once a week. After the first month, the choir director hands out the parts for the next concert. He adds that, socially, he is really glad you are part of this group, and everyone nods. About your part, he says only \"we'll see about you\", and moves on to the next singer.",
    "low": "You have joined a community choir that rehearses once a week. After the first month, the choir director hands out the parts for the next concert. He adds that, socially, to be honest, it is not always easy having you in this group, and several members nod. About your part, he says only \"we'll see about you\", and moves on to the next singer."
   },
   "B": {
    "high": "You have joined a community choir that rehearses once a week. After the first month, the choir director hands out the parts for the next concert. You are given three solos, while most members get none. He adds, \"and as for having you in the group socially…\", stops, and moves on to the next singer.",
    "low": "You have joined a community choir that rehearses once a week. After the first month, the choir director hands out the parts for the next concert. You are not given a solo, while most members get several. He adds, \"and as for having you in the group socially…\", stops, and moves on to the next singer."
   }
  },
  "cogA": [
   "the director thinks my singing is not good enough for a solo.",
   "he simply has not decided the parts yet; it says nothing about me.",
   "the director thinks my singing is good enough for a solo."
  ],
  "cogB": [
   "he was about to say that, socially, having me in the group is not easy.",
   "he simply moved on; it says nothing about me.",
   "he was about to say that, socially, he is glad I am part of the group."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this choir?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this choir?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in the choir, and I would keep coming to rehearsals no matter what."
    ],
    [
     "stay_wait",
     "I would keep coming to rehearsals for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would leave the choir as soon as I could."
    ],
    [
     "submit",
     "I would keep my head down, make sure I am not too visible, and not cause any problems."
    ],
    [
     "status_up",
     "I would work on my voice until the director and the others had to admit what I am worth."
    ],
    [
     "belittle",
     "The next time someone sings off key, I would make sure everyone notices it."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other singers, for example by seeing whether anyone needs help with one of their parts."
    ]
   ]
  }
 },
 {
  "id": "running",
  "name": "Running group",
  "groupType": "group",
  "acceptFirst": true,
  "setup": "You have recently joined a running group that meets three times a week. At the end of the first month, the coordinator reads out everyone's times and distances: he calls each name, the group applauds, and then he reads the results.",
  "setup2": "You have recently joined a running club that meets on Saturday mornings. At the end of the first month, the results of the monthly time trial are read out at the café afterwards: the coach calls each name, people clap, and then he reads the time.",
  "alt": {
   "setup": "You have recently joined a running club that meets on Saturday mornings. At the end of the first month, the results of the monthly time trial are read out at the café afterwards: the coach calls each name, people clap, and then he reads the time.",
   "sH": "He then reads out your time: the fastest in the club.",
   "sL": "He then reads out your time: the slowest in the club.",
   "aH": "When your name is called, the whole café claps.",
   "aL": "When your name is called, nobody claps, and someone at the back boos."
  },
  "alt_mild": {
   "setup": "You have recently joined a running group that meets three evenings a week. At the end of the first month, the coordinator reads out everyone's times and distances at the café: he calls each name, the group applauds, and then he reads the results.",
   "sH": "He then reads out your results: your average time over the group's regular route is the fastest in the group.",
   "sL": "He then reads out your results: your average time over the group's regular route is the slowest in the group.",
   "aH": "When your name is called, everyone applauds.",
   "aL": "When your name is called, nobody applauds, and you even hear a bit of booing."
  },
  "no": 8,
  "sH": "He then reads out your results: your average time over the group's regular route is the fastest in the group.",
  "sL": "He then reads out your results: your average time over the group's regular route is the slowest in the group.",
  "aH": "When your name is called, everyone applauds.",
  "aL": "When your name is called, nobody applauds, and you even hear a bit of booing.",
  "amb": {
   "A": {
    "high": "You have recently joined a running group that meets three times a week. At the end of the first month, the coordinator reads out everyone's times and distances: he calls each name, the group applauds, and then he reads the results. When your name is called, everyone applauds. About your results, the coordinator says, \"Your times were not quite what I expected,\" without explaining further.",
    "low": "You have recently joined a running group that meets three times a week. At the end of the first month, the coordinator reads out everyone's times and distances: he calls each name, the group applauds, and then he reads the results. When your name is called, nobody applauds, and you even hear a bit of booing. About your results, the coordinator says, \"Your times were not quite what I expected,\" without explaining further."
   },
   "B": {
    "high": "You have recently joined a running group that meets three times a week. At the end of the first month, the coordinator reads out everyone's times and distances: he calls each name, the group applauds, and then he reads the results. When your name is called, a few people clap briefly and the rest remain silent. The coordinator then reads out your results: your average time over the group's regular route is the fastest in the group.",
    "low": "You have recently joined a running group that meets three times a week. At the end of the first month, the coordinator reads out everyone's times and distances: he calls each name, the group applauds, and then he reads the results. When your name is called, a few people clap briefly and the rest remain silent. The coordinator then reads out your results: your average time over the group's regular route is the slowest in the group."
   }
  },
  "cogA": [
   "my times were worse than the coordinator expected.",
   "the coordinator expected something different, without necessarily judging my performance as good or bad.",
   "my times were better than the coordinator expected."
  ],
  "cogB": [
   "they do not want me in the group.",
   "people were just tired; it says nothing about me.",
   "the group is pleased to have me there, even though the applause was brief."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this running group?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this running group?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in the running group, and I would keep coming to every run."
    ],
    [
     "stay_wait",
     "I would keep coming for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would leave the group and run on my own."
    ],
    [
     "submit",
     "I would sink into the ground and not make a sound, so as not to draw attention."
    ],
    [
     "status_up",
     "I would run harder than ever and show them all what I am made of."
    ],
    [
     "belittle",
     "I would make sure the group notices how slow some of the others are, so they understand who they are dealing with."
    ],
    [
     "approach",
     "I would make an effort to get closer to the other runners, for example by suggesting coffee after a run."
    ]
   ]
  }
 },
 {
  "id": "q_yearend",
  "name": "Year-end at work: role for next year and the office party",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "At the end of the year, your workplace holds a team meeting to review everyone's results and to plan the end-of-year party that will be held a few days later.",
  "setup2": "At the end of the quarter, your department holds a meeting to go through everyone's sales figures and to organise the team dinner that will take place the following week.",
  "alt": {
   "setup": "At the end of the quarter, your department holds a meeting to go through everyone's sales figures and to organise the team dinner that will take place the following week.",
   "sH": "During the meeting, it turns out that you are the only one who has beaten the quarterly target.",
   "sL": "During the meeting, it turns out that you are the only one who has missed the quarterly target.",
   "aH": "When the dinner comes up, several people make a point of checking that you are coming and save you a place next to them.",
   "aL": "When the dinner comes up, several people put your name forward as the one who could stay on call that evening and skip the dinner."
  },
  "alt_mild": {
   "setup": "At the end of the year, your department holds a team meeting to review everyone's results and to plan the end-of-year party that will be held the following week.",
   "sH": "During the meeting, it turns out that you are the only one who has exceeded the yearly goals.",
   "sL": "During the meeting, it turns out that you are the only one who hasn't met the yearly goals.",
   "aH": "When the party comes up, several people make sure that you are coming and that you will sit next to them.",
   "aL": "When the party comes up, several people bring up your name as someone who could take the shift during the party and not be there."
  },
  "no": 9,
  "sH": "During the meeting, it turns out that you are the only one who has exceeded the yearly goals.",
  "sL": "During the meeting, it turns out that you are the only one who hasn't met the yearly goals.",
  "aH": "When the party comes up, several people make sure that you are coming and that you will sit next to them.",
  "aL": "When the party comes up, several people bring up your name as someone who could take the shift during the party and not be there.",
  "amb": {
   "A": {
    "high": "At the end of the year, your workplace holds a team meeting to review everyone's results and to plan the end-of-year party that will be held a few days later. The meeting begins with the party: when it comes up, several people make sure that you are coming and that you will sit next to them. Then the results are reviewed: everyone's are read out except yours, and nobody comments.",
    "low": "At the end of the year, your workplace holds a team meeting to review everyone's results and to plan the end-of-year party that will be held a few days later. The meeting begins with the party: when it comes up, several people bring up your name as someone who could take the shift during the party and not be there. Then the results are reviewed: everyone's are read out except yours, and nobody comments."
   },
   "B": {
    "high": "At the end of the year, your workplace holds a team meeting to review everyone's results and to plan the end-of-year party that will be held a few days later. During the meeting, it turns out that you are the only one who has exceeded the yearly goals. When the party comes up, someone mentions your name while discussing the arrangements, but you do not hear the rest.",
    "low": "At the end of the year, your workplace holds a team meeting to review everyone's results and to plan the end-of-year party that will be held a few days later. During the meeting, it turns out that you are the only one who hasn't met the yearly goals. When the party comes up, someone mentions your name while discussing the arrangements, but you do not hear the rest."
   }
  },
  "cogA": [
   "my results were poor, and nobody wanted to say so.",
   "mine were simply skipped by mistake; it says nothing about me.",
   "my results were fine, so there was nothing to say."
  ],
  "cogB": [
   "they want me to cover the shift and not come.",
   "my name came up for organisational reasons, without any social preference.",
   "they want to make sure I can come."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this workplace?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this workplace?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in this workplace, and I would keep giving it my all."
    ],
    [
     "stay_wait",
     "I would stay for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would start looking for another job right away."
    ],
    [
     "submit",
     "I would not express my own view, and I would go along with whatever my colleagues decide."
    ],
    [
     "status_up",
     "I would set out to exceed every goal next year and prove what I am worth."
    ],
    [
     "belittle",
     "I would make sure everyone hears where my colleagues fall short, so that they do not think they can treat me like that."
    ],
    [
     "approach",
     "I would make an effort to get closer to my colleagues, for example by joining them at lunch."
    ]
   ]
  }
 },
 {
  "id": "q_promotion",
  "name": "Promotion and the new teams",
  "groupType": "group",
  "acceptFirst": true,
  "setup": "You applied for a promotion to a team-leader role. In the same week, staff members are asked which colleagues they would prefer to work closely with.",
  "setup2": "You applied for a promotion to head of your section. In the same month, everyone in the department is asked which colleagues they would like to share an office with.",
  "alt": {
   "setup": "You applied for a promotion to a supervisor role. In the same fortnight, everyone in your unit is asked which colleagues they would most like on their project.",
   "sH": "You get the promotion to supervisor and are moved to the large office by the window.",
   "sL": "You are not chosen for the promotion, and the colleague who got it moves you to a small office with no window.",
   "aH": "Several colleagues name you, saying that they enjoy working alongside you.",
   "aL": "No colleague names you, and several say that they would rather not have you on their project."
  },
  "alt_mild": {
   "setup": "You applied for a promotion to a team-leader role in a new department. In the same week, staff members are asked which colleagues they would prefer to work closely with.",
   "sH": "You get the promotion to team leader and are given the corner office.",
   "sL": "You are not chosen for the promotion, and the colleague who won the position relocates you to a small windowless office.",
   "aH": "Several colleagues name you, saying that they enjoy your company.",
   "aL": "No colleague names you, and several say that they would rather not spend their working day with you."
  },
  "no": 10,
  "sH": "You get the promotion to team leader and are given the corner office.",
  "sL": "You are not chosen for the promotion, and the colleague who won the position relocates you to a small windowless office.",
  "aH": "Several colleagues name you, saying that they enjoy your company.",
  "aL": "No colleague names you, and several say that they would rather not spend their working day with you.",
  "amb": {
   "A": {
    "high": "You applied for a promotion to a team-leader role. In the same week, staff members are asked which colleagues they would prefer to work closely with. Several colleagues name you, saying that they enjoy your company. Before the promotion decision is announced, your boss says, \"Your application prompted quite a discussion,\" without elaborating.",
    "low": "You applied for a promotion to a team-leader role. In the same week, staff members are asked which colleagues they would prefer to work closely with. No colleague names you, and several say that they would rather not spend their working day with you. Before the promotion decision is announced, your boss says, \"Your application prompted quite a discussion,\" without elaborating."
   },
   "B": {
    "high": "You applied for a promotion to a team-leader role. In the same week, staff members are asked which colleagues they would prefer to work closely with. You get the promotion to team leader and are given the corner office. You hear that colleagues gave feedback about working closely with you, but not what they said.",
    "low": "You applied for a promotion to a team-leader role. In the same week, staff members are asked which colleagues they would prefer to work closely with. You are not chosen for the promotion, and the colleague who won the position relocates you to a small windowless office. You hear that colleagues gave feedback about working closely with you, but not what they said."
   }
  },
  "cogA": [
   "there are doubts about my suitability.",
   "it was a normal discussion of a candidacy.",
   "they were impressed by my abilities."
  ],
  "cogB": [
   "they would rather not work closely with me.",
   "the feedback was about work arrangements, not about liking or disliking me.",
   "they would like to work closely with me."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this workplace?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this workplace?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in this workplace, and I would keep working hard."
    ],
    [
     "stay_wait",
     "I would stay for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would start looking for another job right away."
    ],
    [
     "submit",
     "I would not express my own view, and I would go along with whatever my boss decides."
    ],
    [
     "status_up",
     "I would make my work impossible to overlook and prove to everyone what I am worth."
    ],
    [
     "belittle",
     "I would make sure everyone sees where my colleagues fall short, so they understand who they are dealing with."
    ],
    [
     "approach",
     "I would make an effort to get closer to my colleagues, for example by suggesting we go out together after work."
    ]
   ]
  }
 },
 {
  "id": "q_dinner",
  "name": "Dinner with friends: advice about someone new",
  "groupType": "social",
  "acceptFirst": false,
  "setup": "You are at a dinner with a few friends. One of them asks for advice about someone new she has started seeing, and you, like the others, give her your advice.",
  "setup2": "You are at a picnic with a few friends. One of them asks the group what to do about a colleague who has been treating her badly, and you, like the others, tell her what you would do.",
  "alt": {
   "setup": "You are at a picnic with a few friends. One of them asks the group what to do about a colleague who has been treating her badly, and you, like the others, tell her what you would do.",
   "sH": "She says that your suggestion was among the most helpful she heard all afternoon.",
   "sL": "She says that your suggestion was among the least helpful she heard all afternoon.",
   "aH": "She then says that she would love for you to come along when she next meets that colleague for lunch, and insists that you join.",
   "aL": "She then invites the others to come along when she next meets that colleague for lunch, but not you."
  },
  "alt_mild": {
   "setup": "You are at a birthday dinner with a few friends. One of them asks for advice about someone new she has started seeing, and you, like the others, give her your advice.",
   "sH": "She says that your advice was among the most useful she heard that evening.",
   "sL": "She says that your advice was among the least useful she heard that evening.",
   "aH": "She then says that she would love for you to meet him, and urges you to come along.",
   "aL": "She then invites the others to meet him, but not you."
  },
  "no": 11,
  "sH": "She says that your advice was among the most useful she heard that evening.",
  "sL": "She says that your advice was among the least useful she heard that evening.",
  "aH": "She then says that she would love for you to meet him, and urges you to come along.",
  "aL": "She then invites the others to meet him, but not you.",
  "amb": {
   "A": {
    "high": "You are at a dinner with a few friends. One of them asks for advice about someone new she has started seeing, and you, like the others, give her your advice. She says that she would love for you to meet him, and urges you to come along. About your advice, she says only \"hmm, interesting\", and moves on to the next person.",
    "low": "You are at a dinner with a few friends. One of them asks for advice about someone new she has started seeing, and you, like the others, give her your advice. She invites the others to meet him, but not you. About your advice, she says only \"hmm, interesting\", and moves on to the next person."
   },
   "B": {
    "high": "You are at a dinner with a few friends. One of them asks for advice about someone new she has started seeing, and you, like the others, give her your advice. She says that your advice was among the most useful she heard that evening. She then says that she wants some of you to meet him soon, without saying whom.",
    "low": "You are at a dinner with a few friends. One of them asks for advice about someone new she has started seeing, and you, like the others, give her your advice. She says that your advice was among the least useful she heard that evening. She then says that she wants some of you to meet him soon, without saying whom."
   }
  },
  "cogA": [
   "she thought my advice was unhelpful.",
   "she was just moving the conversation along; it says nothing about me.",
   "she thought my advice was helpful."
  ],
  "cogB": [
   "she does not mean me.",
   "she simply has not decided yet; it says nothing about me.",
   "she means me too."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that this friend values your judgement?"
    ],
    [
     "wanted",
     "How likely is it that this friend wants to include you socially?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to keep in touch with this friend, and I would make the effort."
    ],
    [
     "stay_wait",
     "I would keep in touch for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would stop keeping in touch with this friend."
    ],
    [
     "submit",
     "I would keep quiet and avoid drawing attention to myself."
    ],
    [
     "status_up",
     "I would make a point of showing her what I am capable of."
    ],
    [
     "belittle",
     "I would bring up poor decisions she has made in the past in front of the others, so that she understands who she is dealing with."
    ],
    [
     "approach",
     "I would make an effort to get closer to her, for example by suggesting that we meet up soon."
    ]
   ]
  }
 },
 {
  "id": "q_class",
  "name": "Evening class: the group assignment and the cab",
  "groupType": "group",
  "acceptFirst": true,
  "setup": "You are taking an evening class. Tonight, you and four other members of your group present a major group assignment; afterwards, you are going to celebrate with a beer. After the presentation, you wait for a cab to take you to the bar.",
  "setup2": "You are taking a weekend class. Today, you and four other members of your group present a big joint project; afterwards, you are all going out for pizza. After the presentation, you wait outside for two taxis.",
  "alt": {
   "setup": "You are taking a weekend class. Today, you and four other members of your group present a big joint project; afterwards, you are all going out for pizza. After the presentation, you wait outside for two taxis.",
   "sH": "At the pizzeria, the others say that you carried the project, that the key ideas were yours, and that it would have fallen apart without you.",
   "sL": "At the pizzeria, the others say that your ideas were weak and that you barely contributed to the project.",
   "aH": "The taxis arrive. As the group splits between them, several members insist that you come in theirs.",
   "aL": "The taxis arrive. The other four pile into one taxi together, leaving you to take the second one alone."
  },
  "alt_mild": {
   "setup": "You are taking a weekend class. Tonight, you and four other members of your group present a major group assignment; afterwards, you are going to celebrate with a drink. After the presentation, you wait for a cab to take you to the bar.",
   "sH": "At the bar, the others say that you were the one who led the assignment, that the ideas were yours, and that without you it would not have happened.",
   "sL": "At the bar, the others say that your ideas were poor and that you contributed very little to the assignment.",
   "aH": "Two cabs arrive. As the group divides between them, several members ask you to ride with them.",
   "aL": "Two cabs arrive. The other four insist on travelling together in one cab, leaving you to take the other alone."
  },
  "no": 12,
  "sH": "At the bar, the others say that you were the one who led the assignment, that the ideas were yours, and that without you it would not have happened.",
  "sL": "At the bar, the others say that your ideas were poor and that you contributed very little to the assignment.",
  "aH": "Two cabs arrive. As the group divides between them, several members ask you to ride with them.",
  "aL": "Two cabs arrive. The other four insist on travelling together in one cab, leaving you to take the other alone.",
  "amb": {
   "A": {
    "high": "You are taking an evening class. Tonight, you and four other members of your group present a major group assignment; afterwards, you are going to celebrate with a beer. After the presentation, you wait for a cab to take you to the bar. Two cabs arrive. As the group divides between them, several members ask you to ride with them. At the bar, when the conversation turns to the assignment, someone says about your contribution, \"Your approach was different from ours,\" and the others nod.",
    "low": "You are taking an evening class. Tonight, you and four other members of your group present a major group assignment; afterwards, you are going to celebrate with a beer. After the presentation, you wait for a cab to take you to the bar. Two cabs arrive. The other four insist on travelling together in one cab, leaving you to take the other alone. At the bar, when the conversation turns to the assignment, someone says about your contribution, \"Your approach was different from ours,\" and the others nod."
   },
   "B": {
    "high": "You are taking an evening class. Tonight, you and four other members of your group present a major group assignment; afterwards, you are going to celebrate with a beer. After the presentation, you wait for a cab to take you to the bar. At the bar, the others say that you were the one who led the assignment, that the ideas were yours, and that without you it would not have happened. When it is time to leave, one cab arrives with room for four; for a moment nobody says who will wait for the next one.",
    "low": "You are taking an evening class. Tonight, you and four other members of your group present a major group assignment; afterwards, you are going to celebrate with a beer. After the presentation, you wait for a cab to take you to the bar. At the bar, the others say that your ideas were poor and that you contributed very little to the assignment. When it is time to leave, one cab arrives with room for four; for a moment nobody says who will wait for the next one."
   }
  },
  "cogA": [
   "my approach weakened the work.",
   "it was different, without a judgement of quality.",
   "it added value."
  ],
  "cogB": [
   "they expect me to be the one left behind.",
   "it is just logistics; it says nothing about me.",
   "they will make sure I am not the one left behind."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this project group?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this project group?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to keep working with this project group, and I would give it my all."
    ],
    [
     "stay_wait",
     "I would keep working with this project group for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would stop working with this project group as soon as I could."
    ],
    [
     "submit",
     "I would keep quiet, let the others have the last word, and not push back."
    ],
    [
     "status_up",
     "I would make my part in the next assignment so good that nobody could overlook it."
    ],
    [
     "belittle",
     "I would tell the lecturer where the others fell short in this assignment, so they learn a lesson."
    ],
    [
     "approach",
     "I would make an effort to get closer to the others in my group, for example by suggesting that we meet socially again."
    ]
   ]
  }
 },
 {
  "id": "q_birthday",
  "name": "Farewell drinks",
  "groupType": "social",
  "acceptFirst": true,
  "setup": "After three years at your company, you are leaving because of a relocation, and you organise farewell drinks for the office.",
  "setup2": "After five years at your company, you are leaving for a new job, and you organise a farewell lunch for your department.",
  "alt": {
   "setup": "After four years at your company, you are leaving to move abroad, and you organise farewell drinks for your team.",
   "sH": "In his farewell speech, your manager says that you are one of the best people the team has had in recent years.",
   "sL": "In his farewell speech, your manager remarks, with a grin, that you were never exactly the star of the team, and makes clear that he means your work was below standard.",
   "aH": "Nearly everyone you invited comes, and people keep coming up to tell you how much they will miss you.",
   "aL": "Only a few of the people you invited come, and they seem to be there mostly out of politeness."
  },
  "alt_mild": {
   "setup": "After five years at your company, you are leaving for a new job, and you organise farewell drinks for the office.",
   "sH": "In the farewell speech, your manager says that you are one of the best employees the company has had in recent years.",
   "sL": "In the farewell speech, your manager remarks, with a smile, that you were never exactly employee of the month, and makes clear that he means your work was below standard.",
   "aH": "Almost everyone you invited shows up, and people keep coming over to tell you how much they will miss you.",
   "aL": "Only a few of the people you invited have shown up, and they do not seem very interested in being there."
  },
  "no": 13,
  "sH": "In the farewell speech, your manager says that you are one of the best employees the company has had in recent years.",
  "sL": "In the farewell speech, your manager remarks, with a smile, that you were never exactly employee of the month, and makes clear that he means your work was below standard.",
  "aH": "Almost everyone you invited shows up, and people keep coming over to tell you how much they will miss you.",
  "aL": "Only a few of the people you invited have shown up, and they do not seem very interested in being there.",
  "amb": {
   "A": {
    "high": "After three years at your company, you are leaving because of a relocation, and you organise farewell drinks for the office. Almost everyone you invited shows up, and people keep coming over to tell you how much they will miss you. In the farewell speech, your manager says, with a smile, that you always did what was asked of you.",
    "low": "After three years at your company, you are leaving because of a relocation, and you organise farewell drinks for the office. Only a few of the people you invited have shown up, and they do not seem very interested in being there. In the farewell speech, your manager says, with a smile, that you always did what was asked of you."
   },
   "B": {
    "high": "After three years at your company, you are leaving because of a relocation, and you organise farewell drinks for the office. In the farewell speech, your manager says that you are one of the best employees the company has had in recent years. Looking around the room, you notice that only about half of the people you invited are there.",
    "low": "After three years at your company, you are leaving because of a relocation, and you organise farewell drinks for the office. In the farewell speech, your manager remarks, with a smile, that you were never exactly employee of the month, and makes clear that he means your work was below standard. Looking around the room, you notice that only about half of the people you invited are there."
   }
  },
  "cogA": [
   "my manager means that I only ever did the bare minimum.",
   "it was a routine farewell remark, without a clear evaluation.",
   "my manager means that I consistently did my job well."
  ],
  "cogB": [
   "only half came because many of my colleagues did not particularly want to say goodbye to me.",
   "only half came because of practical commitments, rather than how they feel about me.",
   "my colleagues wanted to say goodbye to me, even though only half could attend."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued by these colleagues?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted by these colleagues?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to keep in touch with these colleagues after I leave, and I would make the effort."
    ],
    [
     "stay_wait",
     "I would keep in touch for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would not keep in touch with these colleagues after I leave."
    ],
    [
     "submit",
     "I would keep quiet and avoid drawing attention to myself."
    ],
    [
     "status_up",
     "I would make sure, before I go, that everyone knows what I achieved here."
    ],
    [
     "belittle",
     "I would let people know, before I go, where some of these colleagues fall short, so that they understand where they went wrong."
    ],
    [
     "approach",
     "I would make an effort to get closer to these colleagues, for example by starting a personal conversation with each of them during the evening."
    ]
   ]
  }
 },
 {
  "id": "island",
  "name": "Desert island (dinner with acquaintances)",
  "groupType": "social",
  "acceptFirst": false,
  "setup": "You are at a dinner with a group of acquaintances. At some point, the game comes up of whom each person would take to a desert island, and why.",
  "setup2": "You are at a barbecue with a group of acquaintances. At some point, someone starts the game of whom you would want with you if you were stranded on a mountain in a snowstorm, and why.",
  "alt": {
   "setup": "You are at a barbecue with a group of acquaintances. At some point, the game comes up of whom each person would take along if stranded on a desert island for a year, and why.",
   "sH": "Your name comes up first as the one most likely to survive there.",
   "sL": "Your name comes up first as the one least likely to survive there.",
   "aH": "When it comes to who would be a good friend to have there, your name comes up first, and everyone agrees that you would look after the others.",
   "aL": "When it comes to who would be a good friend to have there, your name comes up last, and everyone agrees that you would look after yourself."
  },
  "alt_mild": {
   "setup": "You are at a barbecue with a group of acquaintances. At some point, the game comes up of whom each person would take to a desert island, and why.",
   "sH": "Your name comes up first as the one most likely to survive there.",
   "sL": "Your name comes up first as the one least likely to survive there.",
   "aH": "When it comes to who would be a good friend to have there, your name comes up first, and everyone agrees that you would look after them.",
   "aL": "When it comes to who would be a good friend to have there, your name comes up last, and everyone agrees that you would look after yourself."
  },
  "no": 14,
  "sH": "Your name comes up first as the one most likely to survive there.",
  "sL": "Your name comes up first as the one least likely to survive there.",
  "aH": "When it comes to who would be a good friend to have there, your name comes up first, and everyone agrees that you would look after them.",
  "aL": "When it comes to who would be a good friend to have there, your name comes up last, and everyone agrees that you would look after yourself.",
  "amb": {
   "A": {
    "high": "You are at a dinner with a group of acquaintances. At some point, the game comes up of whom each person would take to a desert island, and why. When it comes to who would be a good friend to have there, your name comes up first, and everyone agrees that you would look after them. When it comes to how well you would survive there, someone says \"now that's interesting\", and the game moves on.",
    "low": "You are at a dinner with a group of acquaintances. At some point, the game comes up of whom each person would take to a desert island, and why. When it comes to who would be a good friend to have there, your name comes up last, and everyone agrees that you would look after yourself. When it comes to how well you would survive there, someone says \"now that's interesting\", and the game moves on."
   },
   "B": {
    "high": "You are at a dinner with a group of acquaintances. At some point, the game comes up of whom each person would take to a desert island, and why. Your name comes up first as the one most likely to survive there. When it comes to who would be a good friend to have there, someone says your name, and there is a short silence before the game moves on.",
    "low": "You are at a dinner with a group of acquaintances. At some point, the game comes up of whom each person would take to a desert island, and why. Your name comes up first as the one least likely to survive there. When it comes to who would be a good friend to have there, someone says your name, and there is a short silence before the game moves on."
   }
  },
  "cogA": [
   "they think I would be helpless there.",
   "it was just a way of moving on; it says nothing about me.",
   "they think I would cope well there."
  ],
  "cogB": [
   "they think I would look after no one but myself.",
   "someone just needed a moment; it says nothing about me.",
   "they were quietly agreeing that I would look after them."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued by these acquaintances?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted by these acquaintances?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to keep seeing these acquaintances, and I would make the effort."
    ],
    [
     "stay_wait",
     "I would keep seeing them for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would not keep in touch with these acquaintances."
    ],
    [
     "submit",
     "I would keep my head down and stay quiet for the rest of the evening."
    ],
    [
     "status_up",
     "I would make a point of showing these acquaintances how capable I actually am."
    ],
    [
     "belittle",
     "I would remind these acquaintances how helpless some of them would be, so they understand that the problem is with them."
    ],
    [
     "approach",
     "I would make an effort to get closer to these acquaintances, for example by suggesting that we meet again."
    ]
   ]
  }
 },
 {
  "id": "ten_friends",
  "name": "Weekend away with ten old friends",
  "groupType": "social",
  "acceptFirst": false,
  "setup": "You are on a weekend away with ten old friends who know you well. Around the campfire on the last night, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you.",
  "setup2": "You are at a reunion dinner with ten old friends who know you well. Over dessert, someone starts a round of questions: who at the table has done best for themselves, and who is the person you would call first if you were in trouble.",
  "alt": {
   "setup": "You are at a reunion dinner with ten old friends who know you well. Over dessert, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you.",
   "sH": "When the question of the most successful person comes up, your name is the first to be said.",
   "sL": "When the question of the most successful person comes up, everyone's name is said except yours.",
   "aH": "When the question of whom they would most trust to help them comes up, your name is the first to be said.",
   "aL": "When the question of whom they would most trust to help them comes up, your name is the last to be said."
  },
  "alt_mild": {
   "setup": "You are at a reunion dinner with ten old friends who know you well. Over dessert, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you.",
   "sH": "When the question of the most successful person comes up, your name is the first to be said.",
   "sL": "When the question of the most successful person comes up, everyone's name is said except yours.",
   "aH": "When the question of whom they would most trust to help them comes up, your name is the first to be said.",
   "aL": "When the question of whom they would most trust to help them comes up, your name is the last to be said."
  },
  "no": 15,
  "sH": "When the question of the most successful person comes up, your name is the first to be said.",
  "sL": "When the question of the most successful person comes up, everyone's name is said except yours.",
  "aH": "When the question of whom they would most trust to help them comes up, your name is the first to be said.",
  "aL": "When the question of whom they would most trust to help them comes up, your name is the last to be said.",
  "amb": {
   "A": {
    "high": "You are on a weekend away with ten old friends who know you well. Around the campfire on the last night, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you. When the question of whom they would most trust comes up, your name is the first to be said. When the question of the most successful person comes up and someone says your name, there is a silence.",
    "low": "You are on a weekend away with ten old friends who know you well. Around the campfire on the last night, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you. When the question of whom they would most trust comes up, your name is the last to be said. When the question of the most successful person comes up and someone says your name, there is a silence."
   },
   "B": {
    "high": "You are on a weekend away with ten old friends who know you well. Around the campfire on the last night, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you. When the question of the most successful person comes up, your name is the first to be said. When the question of whom they would most trust to help them comes up and someone says your name, there is a silence.",
    "low": "You are on a weekend away with ten old friends who know you well. Around the campfire on the last night, someone starts a round of questions: who is the most successful person in the group, and who is the person you would most trust to help you. When the question of the most successful person comes up, everyone's name is said except yours. When the question of whom they would most trust to help them comes up and someone says your name, there is a silence."
   }
  },
  "cogA": [
   "they consider me one of the less successful people in the group.",
   "the pause reflects people taking time to think, rather than an evaluation of me.",
   "they consider me one of the more successful people in the group."
  ],
  "cogB": [
   "they do not trust me to be there for them.",
   "the pause reflects people taking time to think, rather than an evaluation of me.",
   "they were quietly agreeing that they would trust me."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued by these friends?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted by these friends?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to remain part of this group of friends, and I would make the effort."
    ],
    [
     "stay_wait",
     "I would stay in touch for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would drift away from this group of friends."
    ],
    [
     "submit",
     "I would keep quiet and avoid drawing attention to myself."
    ],
    [
     "status_up",
     "I would make sure these friends see how successful I actually am."
    ],
    [
     "belittle",
     "I would remind these friends of their own failures, so they learn a lesson."
    ],
    [
     "approach",
     "I would make an effort to get closer to these friends, for example by taking a real interest in how one of them is doing."
    ]
   ]
  }
 },
 {
  "id": "new_office",
  "name": "Moving to a new office",
  "groupType": "group",
  "acceptFirst": false,
  "setup": "Your workplace is moving to a new building. In a team meeting, your manager announces who gets which room, and explains each decision.",
  "setup2": "Your department is moving to a new floor. In a team meeting, your manager announces who gets which desk, and explains each decision.",
  "alt": {
   "setup": "Your company is moving to a new building. In a team meeting, your manager announces who gets which office, and explains each decision.",
   "sH": "You get the largest office, which, the manager says, reflects your contribution to the work.",
   "sL": "You get one of the smallest offices, which, the manager says, reflects your contribution to the work.",
   "aH": "The manager says that you will sit in the middle, next to everyone, because they enjoy having you around.",
   "aL": "The manager says that you will sit on another floor, away from everyone, because the others do not want you around."
  },
  "alt_mild": {
   "setup": "Your department is moving to a new floor. In a team meeting, your manager announces who gets which room, and explains each decision.",
   "sH": "You get the largest room, which, the manager says, reflects your contribution to the work.",
   "sL": "You get one of the smallest rooms, which, the manager says, reflects your contribution to the work.",
   "aH": "The manager says that you will sit near the others because they enjoy having you around.",
   "aL": "The manager says that you will sit on another floor because the others do not want you around."
  },
  "no": 16,
  "sH": "You get the largest room, which, the manager says, reflects your contribution to the work.",
  "sL": "You get one of the smallest rooms, which, the manager says, reflects your contribution to the work.",
  "aH": "The manager says that you will sit near the others because they enjoy having you around.",
  "aL": "The manager says that you will sit on another floor because the others do not want you around.",
  "amb": {
   "A": {
    "high": "Your workplace is moving to a new building. In a team meeting, your manager announces who gets which room, and explains each decision. The manager says that you will sit near the others because they enjoy having you around. About the size of your room, the manager says, \"We need to decide what size of room your contribution warrants,\" without announcing a decision.",
    "low": "Your workplace is moving to a new building. In a team meeting, your manager announces who gets which room, and explains each decision. The manager says that you will sit on another floor because the others do not want you around. About the size of your room, the manager says, \"We need to decide what size of room your contribution warrants,\" without announcing a decision."
   },
   "B": {
    "high": "Your workplace is moving to a new building. In a team meeting, your manager announces who gets which room, and explains each decision. You get the largest room, which, the manager says, reflects your contribution to the work. The manager says that colleagues have expressed preferences about sitting near you, but does not say what those preferences were.",
    "low": "Your workplace is moving to a new building. In a team meeting, your manager announces who gets which room, and explains each decision. You get one of the smallest rooms, which, the manager says, reflects your contribution to the work. The manager says that colleagues have expressed preferences about sitting near you, but does not say what those preferences were."
   }
  },
  "cogA": [
   "the manager thinks my contribution warrants a small room.",
   "the manager is still working through the room allocations; this does not indicate how highly he rates my contribution.",
   "the manager thinks my contribution warrants a large room."
  ],
  "cogB": [
   "they want to sit far away from me.",
   "the preferences are about work needs, not about liking or disliking me.",
   "they want to sit close to me."
  ],
  "block": {
   "likelihood": [
    [
     "stress",
     "How likely is it that you would feel stressed in this situation?"
    ],
    [
     "valued",
     "How likely is it that you are valued in this office?"
    ],
    [
     "wanted",
     "How likely is it that you are wanted in this office?"
    ]
   ],
   "react": [
    [
     "stay_persist",
     "I would very much want to stay in this workplace, and I would keep giving it my all."
    ],
    [
     "stay_wait",
     "I would stay for a while longer to see how things develop."
    ],
    [
     "leave",
     "I would start looking for another job right away."
    ],
    [
     "submit",
     "I would accept the decision without expressing my preferences or asking for a change."
    ],
    [
     "status_up",
     "I would make sure my work stands out this year and prove to the manager what I am worth."
    ],
    [
     "belittle",
     "I would make sure the manager hears where my colleagues fall short, so they understand who they are dealing with."
    ],
    [
     "approach",
     "I would make an effort to get closer to my colleagues, for example by spending time with them on the main floor."
    ]
   ]
  }
 }
];
