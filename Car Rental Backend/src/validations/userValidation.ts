import Joi from "joi";

const userValidation = {
  bookVehicle: {
    body: Joi.object().keys({
      vehicleId: Joi.string().uuid().required().messages({
        "string.empty": "Vehicle ID is required",
        "string.guid": "Vehicle  ID must be a valid UUID",
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
  viewSpecificVehicle: {
    params: Joi.object().keys({
      vehicleId: Joi.string().uuid().required().messages({
        "string.empty": "Vehicle ID is required",
        "string.guid": "Vehicle ID must be a valid UUID",
      }),
    }),
  },
};

export default userValidation;
