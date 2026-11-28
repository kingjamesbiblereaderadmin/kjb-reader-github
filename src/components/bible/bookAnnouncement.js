// A full printed title is voiced once per book, not once for each chapter.
// Chapter-number clips are shared recordings but have a local key in each book.
export default function bookAnnouncement(bookKey, fullName, chapter, includeBook = true) {
  const n = Number(chapter);
  const ones = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  const words = (value) => value < 20 ? ones[value] : value < 100
    ? `${tens[Math.floor(value / 10)]}${value % 10 ? `-${ones[value % 10]}` : ''}`
    : `${ones[Math.floor(value / 100)]} hundred${value % 100 ? ` ${words(value % 100)}` : ''}`;
  return [
    ...(includeBook ? [{ ref: `${bookKey}:0:book-full`, text: fullName }] : []),
    { ref: `${bookKey}:${chapter}:chapter${n >= 100 ? '-c2' : ''}`, text: `Chapter ${n >= 100 ? words(n) : chapter}` },
  ];
}