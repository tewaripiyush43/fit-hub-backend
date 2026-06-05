const authService = require("../services/auth.service");

module.exports = {
  register: async (req, res) => {
    const result = await authService.register(req.body);
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //1 month
    };
    res.cookie("refreshToken", result.refreshToken, options);
    res.status(200).send({ accessToken: result.accessToken });
  },

  login: async (req, res) => {
    const result = await authService.login(req.body);
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //1 month
    };
    res.cookie("refreshToken", result.refreshToken, options);
    res.status(200).send({ accessToken: result.accessToken });
  },

  refreshToken: async (req, res) => {
    const { refreshToken } = req.cookies;
    const result = await authService.refreshToken(refreshToken);
    res.send(result);
  },

  logout: async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.sendStatus(200);
  },

  deleteAccount: async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.deleteAccount(refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.sendStatus(200);
  },

  getPrivateData: async (req, res) => {
    const user = await authService.getPrivateData(req.userId);
    res.send({ user });
  }
};
