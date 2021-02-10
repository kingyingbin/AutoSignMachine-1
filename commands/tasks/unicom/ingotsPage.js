let crypto = require("crypto");
let moment = require("moment");
let { encryptPhone, sign, encrypt } = require("./handlers/PAES.js");
const { useragent, randomNumber } = require("./handlers/myPhone");
const gameEvents = require("./handlers/dailyEvent");
let { transParams } = require("./handlers/gameUtils");
let ingotsPage = {
  doTask: async (axios, options) => {
    console.log("😒 游玩聚宝盆...");
    let cookies = await ingotsPage.getOpenPlatLine(axios, options);
    let info = await ingotsPage.postIndexInfo(axios, options, cookies);
    let result = await ingotsPage.postSign(axios, options, cookies);
    await ingotsPage.signDouble(axios, options, { ...cookies, ...result });
    await ingotsPage.postGame(axios, options, cookies, info);
  },
  // eslint-disable-next-line no-unused-vars
  postIndexInfo: async (axios, options, { ecs_token, searchParams, jar1 }) => {
    let phone = encryptPhone(options.user, "gb6YCccUvth75Tm2");
    let result = await axios.request({
      headers: {
        "user-agent": useragent(options),
        referer: `https://wxapp.msmds.cn/`,
        origin: "https://wxapp.msmds.cn",
      },
      url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/IndexInfo`,
      method: "POST",
      data: transParams({
        channelId: "LT_channel",
        phone: phone,
        token: ecs_token,
        sourceCode: "lt_ingots",
      }),
    });
    if (result.data.code !== 200) {
      throw new Error("❌ something errors: ", result.data.msg);
    }
    return next(result.data.data);
    function next(data) {
      console.log(
        "😒 聚宝盆状态: " + (data["sign"] ? "已签到" : "未签到"),
        "签到次数: " + data["signTimes"]
      );
      console.log(
        "😒 聚宝盆游玩次数:" + data["leftTimes"],
        "预计视频奖励测试: 4"
      );
      return { freeTimes: data["leftTimes"], advertTimes: 4 };
    }
  },
  postSign: async (axios, options) => {
    let phone = encryptPhone(options.user, "gb6YCccUvth75Tm2");
    let result = await axios.request({
      headers: {
        "user-agent": useragent(options),
        referer: `https://wxapp.msmds.cn/`,
        origin: "https://wxapp.msmds.cn",
      },
      url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/sign`,
      method: "POST",
      data: transParams({
        channelId: "LT_channel",
        phone: phone,
        token: options.ecs_token,
        sourceCode: "lt_ingots",
      }),
    });
    switch (result.data.code) {
      case 200:
        return next(result.data.data);
      case 500:
        console.log("😒 聚宝盆签到:" + result.data["msg"]);
        return { double: false };
      default:
        throw new Error("❌ something errors: ", result.data.msg);
    }
    function next(data) {
      console.log("😒 聚宝盆签到获取积分:" + data["prizeName"]);
      console.log(
        "😒 聚宝盆签到翻倍状态:" + (data["double"] ? "可翻倍" : "不可翻倍")
      );
      return { recordId: data["recordId"], double: data["double"] };
    }
  },
  signDouble: async (axios, options, cookies) => {
    console.log("😒 聚宝盆签到翻倍...测试");
    console.log("等待15秒再继续");
    console.log(cookies.double);
    // eslint-disable-next-line no-unused-vars
    await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000));
    // return;
    if (!cookies.double) {
      console.log("❌ 聚宝盆签到翻倍失败");
      return;
    }
    try {
      await ingotsPage.lookVideoDouble(axios, { ...options, ...cookies });
      console.log("⭕ 聚宝盆签到完成");
    } catch (err) {
      console.log("❌ 聚宝盆签到报错: ", err);
    }
  },
  postGame: async (
    axios,
    options,
    // eslint-disable-next-line no-unused-vars
    { ecs_token, searchParams, jar1 },
    { freeTimes, advertTimes }
  ) => {
    console.log("😒 聚宝盆游玩...测试");
    console.log(freeTimes, advertTimes);
    let data;
    //check game time information
    do {
      console.log(
        "已消耗机会",
        1 + 4 - (freeTimes + advertTimes),
        "剩余免费机会",
        freeTimes,
        "看视频广告机会",
        advertTimes
      );
      if (!freeTimes && advertTimes) {
        console.log("视频补充");
        let params = {
          arguments1: "AC20200716103629", // acid
          arguments2: "GGPD", // yhChannel
          arguments3: "45d6dbc3ad144c938cfa6b8e81803b85", // yhTaskId menuId
          arguments4: new Date().getTime(), // time
          arguments6: "517050707",
          arguments7: "517050707",
          arguments8: "123456",
          arguments9: "4640b530b3f7481bb5821c6871854ce5",
          netWay: "Wifi",
          remark1: "签到聚宝盆活动",
          remark: "签到页小游戏",
          version: `android@8.0102`,
          codeId: 945757412,
        };
        params["sign"] = sign([
          params.arguments1,
          params.arguments2,
          params.arguments3,
          params.arguments4,
          params.arguments6,
          params.arguments7,
          params.arguments8,
          params.arguments9,
        ]);
        params["orderId"] = crypto
          .createHash("md5")
          .update(new Date().getTime() + "")
          .digest("hex");
        params["arguments4"] = new Date().getTime();

        await require("./taskcallback").reward(axios, {
          ...options,
          params,
          jar: jar1,
        });
        advertTimes--;
      } else {
        freeTimes--;
      }
      let phone = encryptPhone(options.user, "gb6YCccUvth75Tm2");
      let score = encrypt(randomNumber(12, 20) * 10, "gb6YCccUvth75Tm2");
      let timestamp = moment().format("YYYYMMDDHHmmss");
      let result = await axios.request({
        headers: {
          "user-agent": useragent(options),
          referer: `https://wxapp.msmds.cn/h5/react_web/unicom/ingotsPage?source=unicom&type=02&ticket=${searchParams.ticket}&version=iphone_c@8.0102&timestamp=${timestamp}&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbLm0&userNumber=${options.user}`,
          origin: "https://wxapp.msmds.cn",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        url: `https://wxapp.msmds.cn/jplus/h5/greetGoldIngot/startGame`,
        method: "POST",
        data: transParams({
          channelId: "LT_channel",
          phone: phone,
          token: ecs_token,
          score: score,
          sourceCode: "lt_ingots",
        }),
      });
      console.log(result.data);
      if (result.data.code !== 200) {
        throw new Error("❌ something errors: ", result.data.msg);
      }
      console.log("😒 聚宝盆游玩获得积分: ", result.data.data.prizeName);
      if (!result.data.double) {
        console.log(result.data.double);
        console.log("❌ 聚宝盆游玩暂无翻倍");
        data = { double: false };
      } else {
        data = { double: true };
      }
      await ingotsPage.postGameDouble(axios, options, data);
    } while (freeTimes || advertTimes);
    return data;
  },
  postGameDouble: async (axios, options, cookies) => {
    console.log("😒 聚宝盆游玩开始翻倍");
    console.log("等待15秒再继续");
    console.log(cookies.double);
    // eslint-disable-next-line no-unused-vars
    await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000));

    let params = {
      arguments1: "AC20200716103629", // acid
      arguments2: "GGPD", // yhChannel
      // arguments3: "56ff7ad4a6e84886b18ae8716dfd1d6d", // yhTaskId menuId
      arguments3: "56ff7ad4a6e84886b18ae8716dfd1d6d", // yhTaskId menuId
      arguments4: new Date().getTime(), // time
      arguments6: "517050707",
      arguments7: "517050707",
      arguments8: "123456",
      arguments9: "4640b530b3f7481bb5821c6871854ce5",
      netWay: "Wifi",
      version: `android@8.0102`,
    };
    params["sign"] = sign([
      params.arguments1,
      params.arguments2,
      params.arguments3,
      params.arguments4,
    ]);
    let { num, jar } = await require("./taskcallback").query(axios, {
      ...options,
      params,
    });

    if (!num) {
      console.log("😒 签到小游戏聚宝盆: 今日已完成");
      return;
    }
    params = {
      arguments1: "AC20200716103629", // acid
      arguments2: "GGPD", // yhChannel
      arguments3: "56ff7ad4a6e84886b18ae8716dfd1d6d", // yhTaskId menuId
      arguments4: new Date().getTime(), // time
      arguments6: "517050707",
      arguments7: "517050707",
      arguments8: "123456",
      arguments9: "4640b530b3f7481bb5821c6871854ce5",
      orderId: crypto
        .createHash("md5")
        .update(new Date().getTime() + "")
        .digest("hex"),
      netWay: "Wifi",
      remark: "签到小游戏聚宝盆",
      version: `android@8.0102`,
      codeId: 945757412,
    };
    params["sign"] = sign([
      params.arguments1,
      params.arguments2,
      params.arguments3,
      params.arguments4,
    ]);
    await require("./taskcallback").doTask(axios, {
      ...options,
      params,
      jar,
    });
  },
  lookVideoDouble: async (axios, options) => {
    let params = {
      arguments1: "AC20200716103629", // acid
      arguments2: "GGPD", // yhChannel
      arguments3: "45d6dbc3ad144c938cfa6b8e81803b85", // yhTaskId menuId
      arguments4: new Date().getTime(), // time
      arguments6: "517050707",
      arguments7: "517050707",
      arguments8: "123456",
      arguments9: "4640b530b3f7481bb5821c6871854ce5",
      netWay: "Wifi",
      version: `android@8.0102`,
    };
    params["sign"] = sign([
      params.arguments1,
      params.arguments2,
      params.arguments3,
      params.arguments4,
    ]);
    let { num, jar } = await require("./taskcallback").query(axios, {
      ...options,
      params,
    });

    if (!num) {
      console.log("😒 签到小游戏聚宝盆: 今日已完成");
      return;
    }
    params = {
      arguments1: "AC20200716103629", // acid
      arguments2: "GGPD", // yhChannel
      arguments3: "45d6dbc3ad144c938cfa6b8e81803b85", // yhTaskId menuId
      arguments4: new Date().getTime(), // time
      arguments6: "517050707",
      arguments7: "517050707",
      arguments8: "123456",
      arguments9: "4640b530b3f7481bb5821c6871854ce5",
      orderId: crypto
        .createHash("md5")
        .update(new Date().getTime() + "")
        .digest("hex"),
      netWay: "Wifi",
      remark: "签到小游戏聚宝盆",
      version: `android@8.0102`,
      codeId: 945757412,
    };
    params["sign"] = sign([
      params.arguments1,
      params.arguments2,
      params.arguments3,
      params.arguments4,
    ]);
    await require("./taskcallback").doTask(axios, {
      ...options,
      params,
      jar,
    });
  },
  getOpenPlatLine: gameEvents.getOpenPlatLine(
    `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://wxapp.msmds.cn/h5/react_web/unicom/ingotsPage?source=unicom&duanlianjieabc=tbLm0`,
    {
      base: "msmds",
    }
  ),
};

module.exports = ingotsPage;
