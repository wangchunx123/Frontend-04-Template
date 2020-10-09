  // 不使用状态机
  // function match(str, str2) {
  //   let status = true
  //   let arr = []
  //   for (const j in str2) {
  //     arr.push({name: str2[j], status: false})
  //     for (const i of str) {
  //       if (i == arr[j].name) {
  //         arr[j].status = true
  //       }
  //     }
  //   }
  //   for (const j of arr) {
  //     if (!j.status) {
  //       status = false
  //     }
  //   }
  //   return status
  // }
  // match('abc', 'abcdef')
  // // 'abcdef'
  // console.log(match('abcdef', 'abcdef'))

  // 使用状态机
  // function match(str) {
  //   let state = start
  //   for (let i of str) {
  //     state = state(i)
  //   }
  //   return state === end
  // }
  // function start(c) {
  //   if (c == 'a') {
  //     return fundA
  //   } else {
  //     return start
  //   }
  // }
  // function end(c) {
  //   return end
  // }
  // function fundA(c) {
  //   if (c == 'b') {
  //     return fundB
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundB(c) {
  //   if (c == 'c') {
  //     return fundC
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundC(c) {
  //   if (c == 'a') {
  //     return fundA2
  //   } else {
  //     return start(c)
  //   }
  // }

  // function fundD(c) {
  //   if (c == 'e') {
  //     return fundE
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundE(c) {
  //   if (c == 'f') {
  //     return end
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundA2(c) {
  //   if (c == 'b') {
  //     return fundB2
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundB2(c) {
  //   if (c == 'x') {
  //     return end
  //   } else {
  //     return fundB(c)
  //   }
  // }
  // console.log(match("abcabcabx"))


  // function fundA(c) {
  //   if (c == 'b') {
  //     return fundB
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundB(c) {
  //   if (c == 'a') {
  //     return fundA2
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundA2(c) {
  //   if (c == 'b') {
  //     return fundB2
  //   } else {
  //     return start(c)
  //   }
  // }
  // function fundB2(c) {
  //   if (c == 'x') {
  //     return end
  //   } else {
  //     return fundB(c)
  //   }
  // }

  function match(str) {
    let state = start
    for (let i of str) {
      state = state(i)
    }
    return state === end
  }
  function start(c) {
    if (c == 'a') {
      return fundA
    } else {
      return start
    }
  }
  function end(c) {
    return end
  }
  function kmp(source, pattern) {
    let table = new Array(pattern.length).fill(0)
    {
      let i = 1, j = 0
      while (i < pattern.length) {
        if (pattern[i] === pattern[j]) {
          ++i, ++j
          table[i] = j
        } else {
          if (j > 0) {
            j = table[j]
          } else {
            ++i
          }
        }
      }
    }

    {
      let i = 0,
        j = 0
      while (i < source.length) {
        if (pattern[j] === source[i]) {
          ++i, ++j
        } else {
          if (j > 0) {
            j = table[j]
          } else {
            ++i
          }
        }
        if (j === pattern.length) {
          return { i, j }
        }
      }
      return false
    }
  }
  // console.log(kmp("BBC ABCDAB ABCDABCDABDE", 'ABCDABD'))

