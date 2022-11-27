const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = await req.headers.authorization.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_TOKEN);
      req.user = decodedToken;
      next();
    } catch (err) {
      res.send({
        message: "Invalid token",
      });
    }
  } catch (error) {
    res.status(401).json({
      error: new Error("Invalid request."),
    });
  }
};
