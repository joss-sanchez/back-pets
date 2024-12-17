const jwt = require('jsonwebtoken');

const secretToken = process.env.SECRET_TOKEN;

exports.handler = async (event) => {
  console.log("Authorization event:", event);

  const token = event.headers.Authorization;

  if (!token) {
    console.error("Missing token");
    return generatePolicy("unauthorized", "Deny", event.methodArn, { message: "Missing token" });
  }

  try {
    const {isValid, foundationId = null, userId = null} = validateToken(token);
    if (!isValid) {
      console.error("Invalid token or unauthorized");
      return generatePolicy("unauthorized", "Deny", event.methodArn, { message: "Unauthorized" });
    }

    // Si es válido, devuelve un policy "Allow" con contexto adicional.
    return generatePolicy(userId, "Allow", event.methodArn, {
      userId, foundationId
    });
  } catch (error) {
    console.error("Error processing token:", error.message);
    return generatePolicy("unauthorized", "Deny", event.methodArn, { error: error.message });
  }
};

// Helper para generar el policy
const generatePolicy = (principalId, effect, resource, context = {}) => {
  const authResponse = {
    principalId,
    context,
  };

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    };
  }

  return authResponse;
};

const validateToken = (token) => {
  try {
    const tokenWithoutBearer = token.split(" ");
    if (tokenWithoutBearer[0] !== "Bearer") {
      console.error("Token format invalid");
      return {
        isValid: false
      };
    }

    const verified = jwt.verify(tokenWithoutBearer[1], secretToken);
    console.log("🚀 ~ validateToken ~ verified:", verified)

    return {
      isValid: verified.userId === 'test_user',
      userId: verified.userId,
      foundationId: verified.userId
    };
  } catch (error) {
    console.error("Error decoding JWT:", error.message);
    return {
      isValid: false
    };
  }
};
