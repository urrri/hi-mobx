# How to choose correct dictionary or inline disabling?

- if you see _any KEY_, that contains "junk" and part of that junk
  speller recognized as unknown word - it is subject for **inline disabling**
  without adding that junk to dictionary

  ```js
  'key_T00M4nyJunkW0rds1nK3y'; // cspell:disable-line
  ```

  > **cSpell** has a lot of instruments for inline disabling
  >
  > You can find extended spec in [Document Settings](https://cspell.org/configuration/document-settings/)

- If there is a _test word, site, etc_., mainly in tests or stories -
  it is subject for **inline disabling** without adding that junk to dictionary
  ```js
  const clientPage = 'www.clientpage.com'; // cspell:disable-line
  ```
- If there is a _3rd-party package name, imported name, form field_,
  or similar, that is required by 3rd-party package -
  it is subject for **import-names.txt** dictionary

- If there is a _"weird" name added by us_,
  then it is subject for **project-words.txt** dictionary

- If there is a _really well known word or abbreviation_ (like
  _geographic, historical, currency, company, etc._ name) or
  _word that definitely exists_ or _well-known word combination_,
  but not related to the cases above -
  it is subject for **known-names.txt** dictionary
