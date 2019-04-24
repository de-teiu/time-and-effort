import "../scss/style.scss";
import P5 from "p5";
import "p5/lib/addons/p5.sound";
import IMG_CLOCK from "../images/clock.png";
import IMG_HOURS_LINE from "../images/hoursLine.png";
import IMG_MINUTES_LINE from "../images/minutesLine.png";
import IMG_SECONDS_LINE from "../images/secondsLine.png";
import IMG_REWARD_MAN from "../images/mokuhyou_tassei_man.png";
import IMG_REWARD_WOMAN from "../images/mokuhyou_tassei_woman.png";
import SE_REWARD from "../se/people_people-stadium-cheer1.mp3";
import SE_TWELVE from "../se/trumpet-dub1.mp3";

const sketch = p => {
    const PEOPLE_TYPE_MAN = "MAN";
    const PEOPLE_TYPE_WOMAN = "WOMAN";
    //画面描画用バッファ
    let bufferedImage;
    //画像：時計本体
    let imgClock;
    //画像：長針
    let imgHoursLine;
    //画像：短針
    let imgMinutesLine;
    //画像：秒針
    let imgSecondsLine;
    //画像：報われマン
    let imgRewardMan;
    //画像：報われウーマン
    let imgRewardWoman;
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
    let rewardCount;
    //報われ処理中の人物描画用配列
    let rewardPeopleList;

    //初期化処理(画像と効果音読み込み)
    p.preload = () => {
        imgClock = p.loadImage(IMG_CLOCK);
        imgHoursLine = p.loadImage(IMG_HOURS_LINE);
        imgMinutesLine = p.loadImage(IMG_MINUTES_LINE);
        imgSecondsLine = p.loadImage(IMG_SECONDS_LINE);
        imgRewardMan = p.loadImage(IMG_REWARD_MAN);
        imgRewardWoman = p.loadImage(IMG_REWARD_WOMAN);

        seReward = p.loadSound(SE_REWARD);
        seTwelve = p.loadSound(SE_TWELVE);
    };

    //初期化処理(画面描画設定など)
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        bufferedImage = p.createGraphics(p.windowWidth, p.windowHeight);
        bufferedImage.noStroke();
        //bufferedImage.ellipseMode(p.CENTER);
        bufferedImage.imageMode(p.CENTER);
        p.background(255);
        p.frameRate(60);
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
        const hoursDeg = (hours + minutes / 60) * 30;
        p.drawHand(imgHoursLine, hoursDeg);
        //短針表示
        const minutesDeg = (minutes + seconds / 60) * 6;
        p.drawHand(imgMinutesLine, minutesDeg);
        //秒針表示
        const secondsDeg = (seconds + milliSeconds / 1000) * 6;
        p.drawHand(imgSecondsLine, secondsDeg);


        if (hours !== 11 && hours !== 23) {
            const overlapCheckResult = p.checkOverlap(hoursDeg, minutesDeg);
            if (overlapCheckResult === 0 || (prevCheckResult === -1 && overlapCheckResult === 1)) {
                console.log("かさなった：" + hours + ":" + minutes + ":" + seconds);
                p.initReward();
            }
            prevCheckResult = overlapCheckResult;
        }

        if (rewardCount > 0) {
            rewardPeopleList.forEach((people) => {
                bufferedImage.image(people.type === PEOPLE_TYPE_MAN ? imgRewardMan : imgRewardWoman, people.x, people.y);
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
     * 針を描画する
     **/
    p.drawHand = (img, deg) => {

        bufferedImage.push();
        //回転の中心をキャンバスの中心にする
        bufferedImage.translate(p.windowWidth / 2, p.windowHeight / 2);
        //角度を算出
        bufferedImage.rotate(p.radians(deg));
        //画像描画点を画像の中心にする
        //p.imageMode(CENTER);
        //画像を描画
        bufferedImage.image(img, 0, 0);
        //画像描画点をデフォルトの設定に戻す
        //p.imageMode(CORNER);
        bufferedImage.pop();
    }

    p.checkOverlap = (hoursDeg, minutesDeg) => {
        const roundHoursDeg = Math.round(hoursDeg) % 360;
        const roundMinutesDeg = Math.round(minutesDeg) % 360;

        if (roundHoursDeg > roundMinutesDeg) {
            return -1;
        }
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
        const poopleCount = p.getRandFromRange(20, 40);
        while (rewardPeopleList < poopleCount) {
            const peopleType = p.getRandFromRange(0, 1) === 0 ? PEOPLE_TYPE_MAN : PEOPLE_TYPE_WOMAN;
            rewardPeopleList.push({
                type: peopleType,
                x: p.getRandFromRange(0, p.windowWidth),
                y: p.getRandFromRange(0, p.windowHeight)
            });
        }

        console.log(rewardPeopleList);
    }
};

new P5(sketch);