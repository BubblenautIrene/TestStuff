import TestStuff from '@TestStuff/core'
import Url from '..'

{
  const TestStuff = new TestStuff()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  TestStuff
    .use(Url, {
      companionUrl: '',
      companionCookiesRule: 'same-origin',
      target: 'body',
      title: 'title',
      locale: {
        strings: {
          import: '',
          enterUrlToImport: '',
          failedToFetch: '',
          enterCorrectUrl: '',
        },
      },
    })
    .getPlugin<Url>('Url')!
    .addFile('https://via.placeholder.com/150')
}
