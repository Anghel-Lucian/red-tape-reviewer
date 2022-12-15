import util from 'util';

export function transformOfficeObjectToJsonLd(object) {
  console.log(object);
}

export const safePromisify = function (fun, methodsArray) {
  const suffix = 'Async';
    methodsArray.forEach(method => {
      fun[method + suffix] = util.promisify(fun[method]);
  });
}