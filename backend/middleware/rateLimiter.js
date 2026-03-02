const redisClient = require("../config/redis");

const rateLimit = async (userId) => {
  const key = `rate:${userId}`;
  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, 10); // 10 sec window
  }

  if (count > 5) {
    throw new Error("Too many messages");
  }
};

module.exports = rateLimit;