import { ValidationError } from 'yup';

interface Errors {
  [key: string]: string;
}

function validateErrors(errors: ValidationError): Errors {
  const result: Errors = {};
  errors.inner.forEach((error) => {
    result[error.path] = error.message;
  });
  return result;
}

export default validateErrors;
