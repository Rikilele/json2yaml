/*
 * Types
 */
type stringConverter = (el: any, indentLevel?: number, numSpaces?: number) => string;

interface IHandlerMap {
  [key: string]: stringConverter;
}

/*
 * Checks if the input string is a special string.

 * This is separated out of stringHandler() because both normal values and keys
 * of objects need to know whether the string is special, but may handle it in a
 * different way.
 */
function isSpecialString(s: string): boolean {
  return (
    s === 'true'
    || s === 'false'
    || s === 'null'
    || s === 'undefined'
    || !isNaN(+s)
    || s.includes('#')
    || (s.startsWith('{') && s.endsWith('}'))
    || (s.startsWith('[') && s.endsWith(']'))
  );
}

/*
 * Removes the trailing white spaces and line terminator characters from each
 * line of a string.
 */
function removeTrailingSpaces(input: string): string {
  return input.split('\n').map((s: string) => s.trimRight()).join('\n');
}

/*
 * Why?
 * The JavaScript typeof operator is uninformative e.g. typeof [] === 'object'.
 * Therefore, we declare our own typeOf function.
 */
function typeOf(x: any): string {
  if (x === null) return 'null';
  if (x === undefined) return 'undefined';
  switch (Object.prototype.toString.call(x)) {
    case '[object Array]': return 'array';
    case '[object Boolean]': return 'boolean';
    case '[object Date]': return 'date';
    case '[object Function]': return 'function';
    case '[object Number]': return 'number';
    case '[object Object]': return 'object';
    case '[object RegExp]': return 'regexp';
    case '[object String]': return 'string';
    default: return 'object';
  }
}

const handlers: IHandlerMap = {
  'undefined': undefinedHandler,
  'null': nullHandler,
  'number': numberHandler,
  'boolean': booleanHandler,
  'string': stringHandler,
  'function': functionHandler,
  'array': arrayHandler,
  'object': objectHandler,
};

function undefinedHandler(): string {
  return 'null';
}

function nullHandler(): string {
  return 'null';
}

function numberHandler(n: number): string {
  return n.toString();
}

function booleanHandler(b: boolean): string {
  return b.toString();
}

function stringHandler(s: string): string {
  return isSpecialString(s) ? `'${s}'` : s;
}

function functionHandler(): string {
  return '[object Function]';
}

function arrayHandler(a: any[], indentLevel: number = 0, numSpaces: number = 2): string {
  if (a.length === 0) {
    return '[]';
  }

  return a.reduce((output: string, el: any): string => {
    const type: string = typeOf(el);
    const handler: stringConverter = handlers[type];
    if (handler === undefined) {
      throw new Error(`encountered unknown type: ${type}`);
    }

    const leadingSpaces: string = ' '.repeat(indentLevel * numSpaces);
    return `${output}\n${leadingSpaces}- ${handler(el, indentLevel + 1, numSpaces).trimLeft()}`;
  }, '');
}

function objectHandler(o: object, indentLevel: number = 0, numSpaces: number = 2): string {
  if (Object.keys(o).length === 0) {
    return '{}';
  }

  return Object.keys(o).reduce((output: string, k: string, i: number): string => {
    // @ts-ignore: TS7053
    const val: any = o[k];
    const type: string = typeOf(val);
    const handler: stringConverter = handlers[type];
    if (handler === undefined) {
      throw new Error(`encountered unknown type: ${type}`);
    }

    const leadingSpaces: string = ' '.repeat(indentLevel * numSpaces);
    const keyString = isSpecialString(k) ? `'${k}'` : k;
    return `${output}\n${leadingSpaces}${keyString}: ${handler(val, indentLevel + 1, numSpaces)}`;
  }, '');
}

/**
 * Converts a valid JSON string to a YAML string (trailing newline included).
 * The function will throw an error when the input string is an invalid JSON.
 *
 * @param s The JSON string to convert to yaml
 * @param numSpaces The number of spaces to use for indents
 */
export function json2yaml(s: string, numSpaces: number = 2): string {
  const o: object | any[] = JSON.parse(s);
  const yaml = handlers[typeOf(o)](o, 0, numSpaces);
  return removeTrailingSpaces(yaml).trimLeft().concat('\n');
}
