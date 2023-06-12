import { ValidationResult } from '../types'

const createValidationResult = (
   statusCode: number,
   result: boolean,
   error?: string
) => {
   return {
      statusCode,
      result: {
         success: result,
         error,
      },
   } as ValidationResult
}

export { createValidationResult }
