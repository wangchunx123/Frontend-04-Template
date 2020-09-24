# 学习笔记

## 1. js语言通识 | 泛用语言分类方法

- 乔姆斯基谱系：是计算机科学中刻画形式文法表达能力的一个分类谱系，是由诺姆·乔姆斯基于 1956 年提出的。它包括四个层次：
  - 0- 型文法（无限制文法或短语结构文法）包括所有的文法。
  - 1- 型文法（上下文相关文法）生成上下文相关语言。
  - 2- 型文法（上下文无关文法）生成上下文无关语言。
  - 3- 型文法（正规文法）生成正则语言。（ragular）

一种上下包含的文法

---

### 语言按语法分类

- 非形式语言
  - 中文，英文
- 形式语言（乔姆斯基谱系）

## 2. js语言通识 | 什么是产生式

>- 产生式： 在计算机中指 Tiger 编译器将源程序经过词法分析（Lexical Analysis）和语法分析（Syntax Analysis）后得到的一系列符合文法规则（Backus-Naur Form，BNF）的语句
>- [巴科斯诺尔范式](https://zh.wikipedia.org/wiki/%E5%B7%B4%E7%A7%91%E6%96%AF%E8%8C%83%E5%BC%8F)：即巴科斯范式（英语：Backus Normal Form，缩写为 BNF）是一种用于表示上下文无关文法的语言，上下文无关文法描述了一类形式语言。它是由约翰·巴科斯（John Backus）和彼得·诺尔（Peter Naur）首先引入的用来描述计算机语言语法的符号集。
>- 终结符： 最终在代码中出现的字符（ https://zh.wikipedia.org/wiki/ 終結符與非終結符)

---

### 产生式（BNF）

- 用尖括号括起来的名称来表示语法结构名
- 语法结构分成基础结构和需要用其他语法结构定义的复合结构
  - 基础结构称终结符
  - 复合结构称非终结符
- 引号和中间的字符表示终结符
- 可以有括号
- `*` 表示重复多次
- `|` 表示或
- `+` 表示至少一次

---
四则运算：

- 1 + 2 * 3

**终结符：**

- Number
- `+ - * /`

**非终结符：**

- MultiplicativeExpression
- AddtiveExpression

```BNF
<MultiplicativeExpression>::=<Number>|
    <MultiplicativeExpression>"*"<Number>|
    <MultiplicativeExpression>"/"<Number>|
<AddtiveExpression>::=<MultiplicativeExpression>|
    <AddtiveExpression>"+"<MultiplicativeExpression>|
    <AddtiveExpression>"-"<MultiplicativeExpression>|
```

带括号的四则运算产生式

```BNF
<PrimaryExpression>::= <Number> | "("<AddtiveExpression>")"|
<AddtiveExpression>::=<MultiplicativeExpression>|
    <AddtiveExpression>"+"<MultiplicativeExpression>|
    <AddtiveExpression>"-"<MultiplicativeExpression>|
<MultiplicativeExpression>::=<PrimaryExpression>|
    <MultiplicativeExpression>"*"<PrimaryExpression>
    <MultiplicativeExpression>"/"<PrimaryExpression>
```

## 3. js语言通识 | 深入理解产生式

### 通过产生式理解乔姆斯基谱系

- 0型 无限制文法
  - ?::=?
- 1型 上下文相关文法
  - `?<A>?::=?<B>?`
- 2型 上下文无关文法
  - `<A>::=?`
- 3型 正则文法
  - `<A>::=<A>?`
  - `<A>::=?<A>` ×  不允许 A 出现在尾部

```js
{
    get a { return 1},
    get: 1
}

2 ** 1 ** 2  // 右结合，一般来说 js是上下文无关文法
```

严格意义上来讲， js 是上下文相关文法

---
其他产生式

> EBNF ABNF Customized

// js 里面产生式例子

```EBNF
AdditiveExpression :
    MultiplicativeExpression
    AddtiveExpression +
MultiplicativeExpression
    AdditiveExpression -
MultiplicativeExpression
```

## 4. js语言通识 | 现代语言的分类

### 现代语言的特例

- C++中，* 可能表示乘号或者指针，具体是哪个，取决于星号前面的标识符是否被声明为类型
- Python 中，行首的tab符和空格会根据上一行的行首空白以一定规则被处理成虚拟终结符indent或者 dedent(非形式语言)
- JavaScript中，`/` 号可能是除号，也可能是正则表达式开头，处理方式类似于VB，字符串模板中也需要特殊处理 `}`，还有自动插入分号规则

### 语言的分类

- 形式语言——用途
  - 数据描述语言
        `JSON, HTML, XAML, SQL, CSS`
  - 编程语言
        `C, C++, Java, C#, Python, Ruby, Perl, Lisp, T-SQL, Clojure, Haskell, JavaScript`

- 形式语言——表达方式
  - 声明式语言 `JSON, HTML, XAML, SQL, CSS, Lisp, Clojure, Haskell`
