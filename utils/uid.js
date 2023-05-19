const NUMBERS = [...Array(10)].map((_, y) => String.fromCharCode(y + 48))
const LOWER = [...Array(26)].map((_, y) => String.fromCharCode(y + 97))
const UPPER = [...Array(26)].map((_, y) => String.fromCharCode(y + 65))
const DIGITS = NUMBERS.concat(LOWER).concat(UPPER)

export const base62 = {
  encode(int) {
    if(int === 0) {
      return 0
    }

    let s = []
    while (int > 0) {
      s = [DIGITS[int % 62], ...s]
      int = Math.floor(int / 62)
    }

    return s.join('')
  },
  decode(str) {
    return str.split('').reverse().reduce((acc, cur, i) => {
      return acc + (DIGITS.indexOf(cur) * (62 ** i))
    }, 0)
  }
}