import "../scss/style.scss";
import P5 from "p5";
import "p5/lib/addons/p5.sound";
import IMG_CLOCK from "../images/clock.png";
import IMG_REWARD_MAN from "../images/mokuhyou_tassei_man.png";
import IMG_REWARD_WOMAN from "../images/mokuhyou_tassei_woman.png";
import IMG_TRUMPED_MAN from "../images/musician_trumpet_man.png";
import SE_REWARD from "../se/people_people-stadium-cheer1.mp3";
import SE_TWELVE from "../se/trumpet-dub1.mp3";

const sketch = p => {
    const PEOPLE_TYPE_MAN = "MAN";
    const PEOPLE_TYPE_WOMAN = "WOMAN";
    const HOURS_LINE_LENGTH = 160;
    const MINUTES_LINE_LENGTH = 200;
    const SECONDS_LINE_LENGTH = 230;
    //画面描画用バッファ
    let bufferedImage;
    //画像：時計本体
    let imgClock;
    //画像：報われマン
    let imgRewardMan;
    //画像：報われウーマン
    let imgRewardWoman;
    //画像：トランペットマン
    let imgTrumpetMan;
    //効果音：報われる
    let seReward;
    //効果音：１２時
    let seTwelve;
    //マウスを長押しした時間
    let mousePressedTime = 0;
    //加算する時間
    let addTime = 0;
    //前フレームの長針短針重なり判定の結果を保持しておく
    let prevCheckResult = null;
    //報われ処理カウンタ
    let rewardCount = 0;
    //報われ処理中の人物描画用配列
    let rewardPeopleList;
    //長針と短針の色
    let hoursMinutesColor;
    //秒針の色
    let secondsColor;
    //最後に報われた時
    let lastRewardHours;
    //日付変更処理カウンタ
    let newDayCount = 0;


    //初期化処理(画像と効果音読み込み)
    p.preload = () => {
        imgClock = p.loadImage(IMG_CLOCK);
        imgRewardMan = p.loadImage(IMG_REWARD_MAN);
        imgRewardWoman = p.loadImage(IMG_REWARD_WOMAN);
        imgTrumpetMan = p.loadImage(IMG_TRUMPED_MAN);
        seReward = p.loadSound(SE_REWARD);
        seTwelve = p.loadSound(SE_TWELVE);
    };

    //初期化処理(画面描画設定など)
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        bufferedImage = p.createGraphics(p.windowWidth, p.windowHeight);
        bufferedImage.noStroke();
        bufferedImage.imageMode(p.CENTER);
        p.background(255);
        p.frameRate(30);
        p.angleMode(p.DEGREES);
        hoursMinutesColor = p.color(0, 0, 0);
        secondsColor = p.color(255, 0, 0);

    };

    //画面描画処理
    p.draw = () => {
        //背景描画(前フレームの描画内容を塗りつぶす)
        bufferedImage.background(200);

        //時計描画
        bufferedImage.image(imgClock, p.windowWidth / 2, p.windowHeight / 2);

        //画面長押しで時を加速させる
        if (p.mouseIsPressed) {
            mousePressedTime++;
            if (mousePressedTime > 30) {
                addTime++;
            }
        } else {
            mousePressedTime = 0;
        }

        //針描画
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes() + addTime;
        const seconds = now.getSeconds();
        const milliSeconds = now.getMilliseconds();

        while (minutes >= 60) {
            hours++;
            minutes -= 60;
        }
        hours = hours % 24;

        //長針表示
        bufferedImage.strokeWeight(20);
        bufferedImage.stroke(hoursMinutesColor);
        const hoursDeg = p.reviceAngle((hours + minutes / 60) * 30 - 90);
        p.drawHand(HOURS_LINE_LENGTH, hoursDeg);
        //短針表示
        const minutesDeg = p.reviceAngle((minutes + seconds / 60) * 6 - 90);
        p.drawHand(MINUTES_LINE_LENGTH, minutesDeg);
        //秒針表示
        bufferedImage.strokeWeight(10);
        bufferedImage.stroke(secondsColor);
        const secondsDeg = p.reviceAngle((seconds + milliSeconds / 1000) * 6 - 90);
        p.drawHand(SECONDS_LINE_LENGTH, secondsDeg);


        if (hours !== 11 && hours !== 23 && hours !== 12 && hours !== 0 && lastRewardHours !== hours) {
            const overlapCheckResult = p.checkOverlap(hoursDeg, minutesDeg);
            if (overlapCheckResult === 0 || (prevCheckResult === -1 && overlapCheckResult === 1)) {
                lastRewardHours = hours;
                p.initReward();
            }
            prevCheckResult = overlapCheckResult;
        }

        if ((lastRewardHours === 10 && hours === 12) || (lastRewardHours === 22 && hours === 0)) {
            //12時過ぎた
            lastRewardHours = 0;
            newDayCount = 1;
            seTwelve.play();
        }
        if (newDayCount > 0) {
            bufferedImage.image(imgTrumpetMan, bufferedImage.width / 2, bufferedImage.height / 2,
                imgTrumpetMan.width + p.getRandFromRange(0, 40), imgTrumpetMan.height + p.getRandFromRange(0, 40));
            newDayCount++;
            if (newDayCount >= 150) {
                newDayCount = 0;
            }
        }

        if (rewardCount > 0) {
            rewardPeopleList.forEach((people) => {
                bufferedImage.image(people.type === PEOPLE_TYPE_MAN ? imgRewardMan : imgRewardWoman,
                    people.x + p.getRandFromRange(-2, 3), people.y + p.getRandFromRange(-2, 3));
            });
            rewardCount++;
            if (rewardCount > 60) {
                rewardCount = 0;
            }
        }

        //バッファに出力した描画内容をcanvasに表示
        p.image(bufferedImage, 0, 0);
    };

    /**
     * ウィンドウサイズ変更時イベント
     */
    p.windowResized = () => {
        //変更されたウィンドウサイズに合わせてキャンバスのサイズを更新
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        bufferedImage.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    /**
     * 角度補正
     */
    p.reviceAngle = (deg) => {
        while (deg >= 360) {
            deg -= 360;
        }
        return deg;
    }

    /**
     * 針を描画する
     **/
    p.drawHand = (len, deg) => {
        //長さと角度から針の終端座標を算出
        const sx = bufferedImage.width / 2;
        const sy = bufferedImage.height / 2;
        const ex = sx + len * p.cos(deg);
        const ey = sy + len * p.sin(deg);
        //描画
        bufferedImage.line(sx, sy, ex, ey);
    }

    p.checkOverlap = (hoursDeg, minutesDeg) => {
        let roundHoursDeg = Math.round(hoursDeg) % 360;
        let roundMinutesDeg = Math.round(minutesDeg) % 360;
        if (roundHoursDeg < 0) {
            roundHoursDeg += 360;
        }
        if (roundMinutesDeg < 0) {
            roundMinutesDeg += 360;
        }

        //長針が短針を追い越す直前
        if (roundHoursDeg > roundMinutesDeg && p.abs(roundHoursDeg - roundMinutesDeg) < 10) {
            return -1;
        }
        //短針と長針が丁度重なる
        if (roundHoursDeg === roundMinutesDeg) {
            return 0;
        }

        return 1;
    }

    p.getRandFromRange = (min, max) => {
        return Math.floor(p.random(max - min)) + min;
    }

    p.initReward = () => {
        rewardCount = 1;
        rewardPeopleList = [];
        const poopleCount = p.getRandFromRange(15, 30);
        while (rewardPeopleList.length < poopleCount) {
            const peopleType = p.getRandFromRange(0, 2) === 0 ? PEOPLE_TYPE_MAN : PEOPLE_TYPE_WOMAN;
            rewardPeopleList.push({
                type: peopleType,
                x: p.getRandFromRange(0, p.windowWidth),
                y: p.getRandFromRange(0, p.windowHeight)
            });
        }

        seReward.play();
    }
};

new P5(sketch);