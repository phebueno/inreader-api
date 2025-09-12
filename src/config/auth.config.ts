export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'randomPass',
    expiresIn: '24h',
  },
};
