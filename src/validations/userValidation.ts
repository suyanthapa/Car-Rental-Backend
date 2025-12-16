import Joi from "joi";

const userValidation = {
  bookCar: {
    body: Joi.object().keys({
      carId: Joi.string().uuid().required().messages({
        "string.empty": "Car ID is required",
        "string.guid": "Car ID must be a valid UUID",
      }),
      startDate: Joi.date().iso().required().messages({
        "date.base": "Start date must be a valid date",
        "any.required": "Start date is required",
      }),
      endDate: Joi.date().iso().required().messages({
        "date.base": "End date must be a valid date",
        "any.required": "End date is required",
      }),
    }),
  },
};

export default userValidation;
