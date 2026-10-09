import { TEXTBOOK_CATALOG } from './textbooks.js?v=20261007_beta2_final';

export const PRACTICE_CHOICES = [
  ...TEXTBOOK_CATALOG.mixed.grades.map(g => ({
    key: `grade-${g.gradeLevel || Number(g.gradeId.match(/\d+/)[0])}`,
    label: g.gradeName, description: g.lessons[0].title,
    source: { selectedTextbook: { publisherId: 'mixed', gradeId: g.gradeId,
      lessonId: g.lessons[0].lessonId }, useCustomVocabulary: false, languageMode: 'bopomofo' }
  })),
  { key: 'jianghu', label: '江湖預設題本（保留舊進度）', description: '保留原有進度及之前選用的題庫；未選題庫時使用江湖題目。' },
  { key: 'english', label: '英文', description: '國小程度：基礎單字 → 生活單字 → 簡短生活句。',
    source: { selectedTextbook: null, useCustomVocabulary: false, languageMode: 'english' } },
  { key: 'custom', label: '爸媽自訂祕笈', description: '使用已儲存的自訂詞彙。請至爸媽祕笈編輯內容。',
    source: { selectedTextbook: null, useCustomVocabulary: true, languageMode: 'bopomofo' } },
  ...TEXTBOOK_CATALOG.moe.grades.flatMap(g => g.lessons.map(l => ({
    key: `moe-${l.lessonId}`, label: `常用字・${l.title}`, description: '教育部國語小字典，遊戲自編分組。',
    source: { selectedTextbook: { publisherId: 'moe', gradeId: g.gradeId, lessonId: l.lessonId },
      useCustomVocabulary: false, languageMode: 'bopomofo' }
  })))
];

// 舊題本保留於存檔及內部對照，主選單只提供六個年級與英文。
export const MAIN_PRACTICE_CHOICES = PRACTICE_CHOICES.filter(choice => /^grade-[1-6]$/.test(choice.key) || choice.key === 'english');

const words = [
  'cat', 'dog', 'sun', 'moon', 'book', 'tree', 'bird', 'fish', 'water', 'school',
  'apple', 'milk', 'egg', 'rice', 'bread', 'cake', 'ball', 'bag', 'pen', 'pencil',
  'red', 'blue', 'green', 'black', 'white', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten', 'boy', 'girl', 'hand', 'eye', 'ear',
  'ant', 'bee', 'cow', 'duck', 'frog', 'goat', 'hen', 'lion', 'mouse', 'pig',
  'sheep', 'star', 'sky', 'cloud', 'rain', 'wind', 'snow', 'fire', 'rock', 'sand',
  'leaf', 'rose', 'grass', 'hill', 'lake', 'sea', 'ship', 'boat', 'bus', 'car',
  'bike', 'train', 'plane', 'kite', 'doll', 'drum', 'bell', 'cup', 'dish', 'fork',
  'spoon', 'bowl', 'desk', 'chair', 'bed', 'door', 'wall', 'roof', 'room', 'yard',
  'park', 'zoo', 'shop', 'bank', 'farm', 'road', 'map', 'box', 'key', 'hat',
  'cap', 'coat', 'shoe', 'sock', 'ring', 'fan', 'lamp', 'clock', 'soap', 'comb',
  'nose', 'mouth', 'face', 'head', 'hair', 'neck', 'arm', 'leg', 'foot', 'knee'
];

const livingWords = [
  'family', 'father', 'mother', 'brother', 'sister', 'friend', 'teacher', 'student',
  'classroom', 'English', 'morning', 'afternoon', 'evening', 'breakfast', 'lunch', 'dinner',
  'orange', 'banana', 'chicken', 'rabbit', 'elephant', 'flower', 'garden', 'yellow', 'purple',
  'happy', 'hungry', 'thirsty', 'small', 'beautiful',
  'grandpa', 'grandma', 'uncle', 'aunt', 'cousin', 'doctor', 'nurse', 'driver', 'farmer', 'worker',
  'library', 'hospital', 'market', 'station', 'kitchen', 'bedroom', 'bathroom', 'window', 'mirror', 'table',
  'notebook', 'eraser', 'ruler', 'marker', 'crayon', 'picture', 'music', 'science', 'history', 'summer',
  'winter', 'spring', 'autumn', 'weather', 'rainbow', 'mountain', 'forest', 'island', 'river', 'bridge',
  'monkey', 'tiger', 'horse', 'turtle', 'dolphin', 'panda', 'giraffe', 'butter', 'cheese', 'noodle',
  'cookie', 'salad', 'tomato', 'potato', 'carrot', 'lemon', 'peach', 'grape', 'melon', 'jacket',
  'sweater', 'pocket', 'umbrella', 'basket', 'bottle', 'candle', 'camera', 'ticket', 'brave', 'clever'
];

const phrases = [
  'good morning', 'thank you', 'read a book', 'drink some water', 'go to school',
  'this is my bag', 'that is a cat', 'i like apples', 'i can swim', 'we are friends',
  'she is my sister', 'he is my brother', 'my name is Amy', 'what is your name',
  'how are you', 'i am happy', 'please sit down', 'open your book', 'close the door', 'have a nice day',
  'good afternoon', 'good evening', 'see you tomorrow', 'you are welcome', 'excuse me please',
  'wash your hands', 'brush your teeth', 'clean the room', 'make the bed', 'set the table',
  'eat your lunch', 'drink your milk', 'put on your coat', 'take off your hat', 'tie your shoes',
  'look at the sky', 'listen to music', 'draw a picture', 'sing a happy song', 'play in the park',
  'ride a blue bike', 'fly a paper kite', 'feed the little dog', 'water the flowers', 'help your mother',
  'share with friends', 'wait for the bus', 'cross the street', 'walk in the rain', 'run on the grass',
  'jump up and down', 'stand in a line', 'raise your hand', 'write your name', 'count from one to ten',
  'tell a funny story', 'watch the bright moon', 'catch the red ball', 'open the window', 'turn on the light',
  'turn off the fan', 'pack your school bag', 'find the lost key', 'climb the green hill', 'swim in the lake',
  'row a small boat', 'plant a young tree', 'pick a sweet peach', 'bake a birthday cake', 'make a wish now',
  'smile at everyone', 'be kind and brave', 'do your homework', 'learn new words', 'speak loud and clear',
  'keep the desk clean', 'follow the rules', 'work as a team', 'enjoy the sunny day', 'sleep well tonight'
];

export const ENGLISH_PRACTICE_BANKS = {
  easy: words.map(text => ({ text, mode: 'english', meaning: '英文基礎單字練習' })),
  medium: livingWords.map(text => ({ text, mode: 'english', meaning: '國小程度・生活單字練習' })),
  hard: phrases.map(text => ({ text, mode: 'english', meaning: '國小程度・簡短生活句練習' }))
};
