import { Decimal } from './decimal';
export function tryDecimalEvaluation(sanitized: string): { result: string | null; handled: boolean } {
  const isDecimalEligible = new RegExp(
    '^(?:\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|[-+*/() ])+$'
  ).test(sanitized);
  if (!isDecimalEligible) {
    return { result: null, handled: false };
  }
  try {
    const rawTokens = sanitized.match(
      new RegExp('(?:\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|[-+*/()])', 'g')
    );
    if (rawTokens && rawTokens.length > 0) {
      const output: (Decimal | string)[] = [];
      const ops: string[] = [];
      const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
      let prevToken: string | null = null;
      for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];
        if (/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
          output.push(Decimal.fromString(token));
        } else if (token === '(') {
          ops.push(token);
        } else if (token === ')') {
          while (ops.length && ops[ops.length - 1] !== '(') {
            output.push(ops.pop()!);
          }
          ops.pop();
        } else if (['+', '-', '*', '/'].includes(token)) {
          if (
            (token === '-' || token === '+') &&
            (prevToken === null || ['+', '-', '*', '/', '('].includes(prevToken))
          ) {
            output.push(new Decimal(0n, 0));
          }
          while (
            ops.length &&
            ops[ops.length - 1] !== '(' &&
            precedence[ops[ops.length - 1]] >= precedence[token]
          ) {
            output.push(ops.pop()!);
          }
          ops.push(token);
        }
        prevToken = token;
      }
      while (ops.length) output.push(ops.pop()!);
      const stack: Decimal[] = [];
      for (const tok of output) {
        if (tok instanceof Decimal) {
          stack.push(tok);
        } else {
          const b = stack.pop();
          const a = stack.pop();
          if (!a || !b) throw new Error('Invalid');
          if (tok === '+') stack.push(a.add(b));
          else if (tok === '-') stack.push(a.sub(b));
          else if (tok === '*') stack.push(a.mul(b));
          else if (tok === '/') stack.push(a.div(b));
        }
      }
      if (stack.length === 1) {
        return { result: stack[0].toString(), handled: true };
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'Undefined') {
      return { result: 'Undefined', handled: true };
    }
  }
  return { result: null, handled: false };
}
