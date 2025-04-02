import jwt from "jsonwebtoken";
const ACCESS_TOKEN_SECRET = Bun.env.ACCESS_TOKEN_SECRET;

const authenticateAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        statusCode: 401,
        isSuccess: false,
        error: "Unauthorized",
        message: "Access token is required!",
      });
    }

    const decodedAccessToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    req.user = decodedAccessToken;
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      isSuccess: false,
      error: "Unauthorized",
      message: "User is not authenticated!",
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        statusCode: 403,
        isSuccess: false,
        error: "Forbidden",
        message: "You do not have permission to access this resource!",
      });
    }

    next();
  };
};

const validate = (cb) => {
  return (req, res, next) => {
    try {
      cb(req);
      next();
    } catch (err) {
      return res.status(400).json({
        statusCode: 400,
        isSuccess: false,
        error: "Bad Request",
        message: err.message,
      });
    }
  };
};

export { authenticateAccessToken, authorizeRoles, validate };
