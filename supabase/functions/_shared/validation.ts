// Shared validation utilities for edge functions

/**
 * Validates that a value is a number within specified range
 */
export function validateNumber(
  value: unknown,
  options: { min?: number; max?: number; required?: boolean; fieldName: string }
): { valid: boolean; value?: number; error?: string } {
  const { min, max, required = false, fieldName } = options;

  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value: undefined };
  }

  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (min !== undefined && value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && value > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true, value };
}

/**
 * Validates that a value is a string within specified length
 */
export function validateString(
  value: unknown,
  options: { minLength?: number; maxLength?: number; required?: boolean; fieldName: string; pattern?: RegExp }
): { valid: boolean; value?: string; error?: string } {
  const { minLength, maxLength, required = false, fieldName, pattern } = options;

  if (value === undefined || value === null || value === "") {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value: undefined };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const trimmed = value.trim();

  if (minLength !== undefined && trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }

  if (pattern && !pattern.test(trimmed)) {
    return { valid: false, error: `${fieldName} has an invalid format` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates that a value is a valid UUID
 */
export function validateUUID(
  value: unknown,
  options: { required?: boolean; fieldName: string }
): { valid: boolean; value?: string; error?: string } {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  const stringResult = validateString(value, { 
    required: options.required, 
    fieldName: options.fieldName,
    pattern: uuidPattern 
  });

  if (!stringResult.valid) {
    return { valid: false, error: `${options.fieldName} must be a valid UUID` };
  }

  return stringResult;
}

/**
 * Validates that a value is an array with specified constraints
 */
export function validateArray(
  value: unknown,
  options: { minLength?: number; maxLength?: number; required?: boolean; fieldName: string }
): { valid: boolean; value?: unknown[]; error?: string } {
  const { minLength, maxLength, required = false, fieldName } = options;

  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value: undefined };
  }

  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }

  if (minLength !== undefined && value.length < minLength) {
    return { valid: false, error: `${fieldName} must have at least ${minLength} items` };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, error: `${fieldName} must have at most ${maxLength} items` };
  }

  return { valid: true, value };
}

/**
 * Validates health metrics input
 */
export function validateHealthMetrics(input: unknown): { valid: boolean; data?: Record<string, unknown>; errors?: string[] } {
  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Request body must be a valid object"] };
  }

  const data = input as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Record<string, unknown> = {};

  // Validate device_id (optional UUID)
  const deviceIdResult = validateUUID(data.device_id, { fieldName: "device_id", required: false });
  if (!deviceIdResult.valid && data.device_id !== undefined) {
    errors.push(deviceIdResult.error!);
  } else if (deviceIdResult.value) {
    validated.device_id = deviceIdResult.value;
  }

  // Validate heart_rate (30-250 bpm)
  const heartRateResult = validateNumber(data.heart_rate, { fieldName: "heart_rate", min: 30, max: 250 });
  if (!heartRateResult.valid) errors.push(heartRateResult.error!);
  else if (heartRateResult.value !== undefined) validated.heart_rate = heartRateResult.value;

  // Validate blood pressure systolic (50-250 mmHg)
  const bpSysResult = validateNumber(data.blood_pressure_systolic, { fieldName: "blood_pressure_systolic", min: 50, max: 250 });
  if (!bpSysResult.valid) errors.push(bpSysResult.error!);
  else if (bpSysResult.value !== undefined) validated.blood_pressure_systolic = bpSysResult.value;

  // Validate blood pressure diastolic (30-150 mmHg)
  const bpDiaResult = validateNumber(data.blood_pressure_diastolic, { fieldName: "blood_pressure_diastolic", min: 30, max: 150 });
  if (!bpDiaResult.valid) errors.push(bpDiaResult.error!);
  else if (bpDiaResult.value !== undefined) validated.blood_pressure_diastolic = bpDiaResult.value;

  // Validate blood_sugar (20-600 mg/dL)
  const sugarResult = validateNumber(data.blood_sugar, { fieldName: "blood_sugar", min: 20, max: 600 });
  if (!sugarResult.valid) errors.push(sugarResult.error!);
  else if (sugarResult.value !== undefined) validated.blood_sugar = sugarResult.value;

  // Validate steps (0-100,000)
  const stepsResult = validateNumber(data.steps, { fieldName: "steps", min: 0, max: 100000 });
  if (!stepsResult.valid) errors.push(stepsResult.error!);
  else if (stepsResult.value !== undefined) validated.steps = stepsResult.value;

  // Validate calories (0-50,000)
  const caloriesResult = validateNumber(data.calories, { fieldName: "calories", min: 0, max: 50000 });
  if (!caloriesResult.valid) errors.push(caloriesResult.error!);
  else if (caloriesResult.value !== undefined) validated.calories = caloriesResult.value;

  // Validate oxygen_saturation (50-100%)
  const oxygenResult = validateNumber(data.oxygen_saturation, { fieldName: "oxygen_saturation", min: 50, max: 100 });
  if (!oxygenResult.valid) errors.push(oxygenResult.error!);
  else if (oxygenResult.value !== undefined) validated.oxygen_saturation = oxygenResult.value;

  // Validate body_temperature (30-45°C)
  const tempResult = validateNumber(data.body_temperature, { fieldName: "body_temperature", min: 30, max: 45 });
  if (!tempResult.valid) errors.push(tempResult.error!);
  else if (tempResult.value !== undefined) validated.body_temperature = tempResult.value;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

/**
 * Validates emergency share request
 */
export function validateEmergencyShare(input: unknown): { valid: boolean; data?: Record<string, unknown>; errors?: string[] } {
  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Request body must be a valid object"] };
  }

  const data = input as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Record<string, unknown> = {};

  // Validate alert_id (required UUID)
  const alertIdResult = validateUUID(data.alert_id, { fieldName: "alert_id", required: true });
  if (!alertIdResult.valid) errors.push(alertIdResult.error!);
  else validated.alert_id = alertIdResult.value;

  // Validate hospital_name (required, max 200 chars)
  const hospitalNameResult = validateString(data.hospital_name, { fieldName: "hospital_name", required: true, maxLength: 200 });
  if (!hospitalNameResult.valid) errors.push(hospitalNameResult.error!);
  else validated.hospital_name = hospitalNameResult.value;

  // Validate hospital_address (required, max 500 chars)
  const hospitalAddressResult = validateString(data.hospital_address, { fieldName: "hospital_address", required: true, maxLength: 500 });
  if (!hospitalAddressResult.valid) errors.push(hospitalAddressResult.error!);
  else validated.hospital_address = hospitalAddressResult.value;

  // Validate hospital_phone (optional, max 50 chars)
  const hospitalPhoneResult = validateString(data.hospital_phone, { fieldName: "hospital_phone", maxLength: 50 });
  if (!hospitalPhoneResult.valid) errors.push(hospitalPhoneResult.error!);
  else if (hospitalPhoneResult.value) validated.hospital_phone = hospitalPhoneResult.value;

  // Validate latitude (-90 to 90)
  const latResult = validateNumber(data.latitude, { fieldName: "latitude", required: true, min: -90, max: 90 });
  if (!latResult.valid) errors.push(latResult.error!);
  else validated.latitude = latResult.value;

  // Validate longitude (-180 to 180)
  const lngResult = validateNumber(data.longitude, { fieldName: "longitude", required: true, min: -180, max: 180 });
  if (!lngResult.valid) errors.push(lngResult.error!);
  else validated.longitude = lngResult.value;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

/**
 * Validates document analysis request
 */
export function validateDocumentAnalysis(input: unknown): { valid: boolean; data?: Record<string, unknown>; errors?: string[] } {
  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Request body must be a valid object"] };
  }

  const data = input as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Record<string, unknown> = {};

  // Validate documentId (required UUID)
  const docIdResult = validateUUID(data.documentId, { fieldName: "documentId", required: true });
  if (!docIdResult.valid) errors.push(docIdResult.error!);
  else validated.documentId = docIdResult.value;

  // Validate documentContent (required, max 500KB text)
  const contentResult = validateString(data.documentContent, { fieldName: "documentContent", required: true, maxLength: 500000 });
  if (!contentResult.valid) errors.push(contentResult.error!);
  else validated.documentContent = contentResult.value;

  // Validate documentType (required, max 100 chars)
  const typeResult = validateString(data.documentType, { fieldName: "documentType", required: true, maxLength: 100 });
  if (!typeResult.valid) errors.push(typeResult.error!);
  else validated.documentType = typeResult.value;

  // Validate fileName (required, max 255 chars)
  const fileNameResult = validateString(data.fileName, { fieldName: "fileName", required: true, maxLength: 255 });
  if (!fileNameResult.valid) errors.push(fileNameResult.error!);
  else validated.fileName = fileNameResult.value;

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

/**
 * Validates health plan generation request
 */
export function validateHealthPlanRequest(input: unknown): { valid: boolean; data?: Record<string, unknown>; errors?: string[] } {
  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Request body must be a valid object"] };
  }

  const data = input as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Record<string, unknown> = {};

  // Validate planType (required, allowed values)
  const allowedPlanTypes = ["general", "weight_loss", "diabetes", "heart_health", "fitness", "nutrition"];
  const planTypeResult = validateString(data.planType, { fieldName: "planType", required: true, maxLength: 50 });
  if (!planTypeResult.valid) {
    errors.push(planTypeResult.error!);
  } else if (!allowedPlanTypes.includes(planTypeResult.value!)) {
    errors.push(`planType must be one of: ${allowedPlanTypes.join(", ")}`);
  } else {
    validated.planType = planTypeResult.value;
  }

  // Validate duration (7, 14, or 30 days)
  const durationResult = validateNumber(data.duration, { fieldName: "duration", required: true, min: 7, max: 30 });
  if (!durationResult.valid) {
    errors.push(durationResult.error!);
  } else if (![7, 14, 30].includes(durationResult.value!)) {
    errors.push("duration must be 7, 14, or 30 days");
  } else {
    validated.duration = durationResult.value;
  }

  // Validate focusAreas (required array, max 10 items)
  const focusAreasResult = validateArray(data.focusAreas, { fieldName: "focusAreas", required: true, minLength: 1, maxLength: 10 });
  if (!focusAreasResult.valid) {
    errors.push(focusAreasResult.error!);
  } else {
    // Validate each focus area is a string
    const focusAreas = focusAreasResult.value!;
    const validatedAreas: string[] = [];
    for (let i = 0; i < focusAreas.length; i++) {
      const areaResult = validateString(focusAreas[i], { fieldName: `focusAreas[${i}]`, required: true, maxLength: 100 });
      if (!areaResult.valid) {
        errors.push(areaResult.error!);
      } else {
        validatedAreas.push(areaResult.value!);
      }
    }
    validated.focusAreas = validatedAreas;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

/**
 * Validates health assistant chat request
 */
export function validateChatRequest(input: unknown): { valid: boolean; data?: Record<string, unknown>; errors?: string[] } {
  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Request body must be a valid object"] };
  }

  const data = input as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Record<string, unknown> = {};

  // Validate messages (required array, max 50 messages)
  const messagesResult = validateArray(data.messages, { fieldName: "messages", required: true, minLength: 1, maxLength: 50 });
  if (!messagesResult.valid) {
    errors.push(messagesResult.error!);
  } else {
    const messages = messagesResult.value!;
    const validatedMessages: unknown[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i] as Record<string, unknown>;
      if (!msg || typeof msg !== "object") {
        errors.push(`messages[${i}] must be an object`);
        continue;
      }

      // Validate role
      const roleResult = validateString(msg.role, { fieldName: `messages[${i}].role`, required: true, maxLength: 20 });
      if (!roleResult.valid) {
        errors.push(roleResult.error!);
      } else if (!["user", "assistant", "system"].includes(roleResult.value!)) {
        errors.push(`messages[${i}].role must be 'user', 'assistant', or 'system'`);
      }

      // Validate content (max 50KB per message)
      const contentResult = validateString(msg.content, { fieldName: `messages[${i}].content`, required: true, maxLength: 50000 });
      if (!contentResult.valid) {
        errors.push(contentResult.error!);
      }

      if (roleResult.valid && contentResult.valid) {
        validatedMessages.push({ role: roleResult.value, content: contentResult.value });
      }
    }
    validated.messages = validatedMessages;
  }

  // Validate conversationId (optional UUID)
  if (data.conversationId !== undefined) {
    const convIdResult = validateUUID(data.conversationId, { fieldName: "conversationId", required: false });
    if (!convIdResult.valid) errors.push(convIdResult.error!);
    else if (convIdResult.value) validated.conversationId = convIdResult.value;
  }

  // Validate queryType (optional, max 50 chars)
  const queryTypeResult = validateString(data.queryType, { fieldName: "queryType", maxLength: 50 });
  if (!queryTypeResult.valid) errors.push(queryTypeResult.error!);
  else if (queryTypeResult.value) validated.queryType = queryTypeResult.value;

  // Validate location (optional object)
  if (data.location !== undefined && data.location !== null) {
    const loc = data.location as Record<string, unknown>;
    if (typeof loc !== "object") {
      errors.push("location must be an object");
    } else {
      const latResult = validateNumber(loc.latitude, { fieldName: "location.latitude", min: -90, max: 90 });
      const lngResult = validateNumber(loc.longitude, { fieldName: "location.longitude", min: -180, max: 180 });
      const cityResult = validateString(loc.city, { fieldName: "location.city", maxLength: 100 });
      
      if (!latResult.valid) errors.push(latResult.error!);
      if (!lngResult.valid) errors.push(lngResult.error!);
      if (!cityResult.valid) errors.push(cityResult.error!);
      
      if (latResult.valid && lngResult.valid) {
        validated.location = {
          latitude: latResult.value,
          longitude: lngResult.value,
          city: cityResult.value,
        };
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validated };
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(errors: string[], corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ 
      error: "Validation failed", 
      details: errors 
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
