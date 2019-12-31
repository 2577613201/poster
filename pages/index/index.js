// pages/promotion/share/share.js
const app = getApp();
var QR = require("../../utils/qrcode.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    saveImgBtn: true,
    openSettingBtn: false,

    qrCodeImgs: '',
    qrcodeWidth: '',
    qrcodeHeight: '',
    share_text: '根据后台传回的背景图和二维码链接生成带二维码的海报',
    share_poster: '', //背景图片
    link: '', //要生成二维码的链接    

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    wx.getSystemInfo({
      success(res) {
        let ratio = res.windowWidth / 750;
        that.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight,
          ratio: ratio,
        });
      }
    });


  },

  /****保存图片 */
  saveImg: function(e) {
    let sharePoster = e.currentTarget.dataset.poster;
    let link = e.currentTarget.dataset.link;
    let that = this
    wx.getSetting({
      success(res) {
        //未授权 先授权 然后保存
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success(re) {
              that.canvas(sharePoster, link);
              that.setData({
                saveImgBtn: true,
                openSettingBtn: false
              })
            },
            fail() {
              that.setData({
                saveImgBtn: false,
                openSettingBtn: true
              })
            }
          })
        } else {
          //已授 直接调用保存到相册方法
          that.canvas(sharePoster, link);
          that.setData({
            saveImgBtn: true,
            openSettingBtn: false
          })
        }
      }
    })
  },
  //保存网络图片到相册方法
  saveToBlum: function(tempFilePath) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success(result) {
        wx.showToast({
          title: '已保存至相册'
        })
      }
    })
  },
  //复制
  copyText: function(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success: function(res) {
        wx.getClipboardData({
          success: function(res) {
            wx.showToast({
              title: '复制成功'
            })
          }
        })
      }
    })
  },

  canvas(sharePoster, link) {
    wx.showLoading({
      title: '正在生成……',
    })
    var that = this;
    //设置二维码宽高
    this.setData({
      qrcodeWidth: 270,
      qrcodeHeight: 270
    })

    QR.api.draw(link, 'canvas', this.data.qrcodeWidth, this.data.qrcodeHeight);    //调用方法，生成二维码
    setTimeout(() => {
      this.canvasToTempImage(sharePoster);
    }, 1000);
  },

  //获取临时路径，存入data中
  canvasToTempImage: function(sharePoster) {
    var that = this;
    wx.canvasToTempFilePath({
      fileType: 'jpg',
      canvasId: 'canvas',
      success: function(res) {

        that.savePoster(res.tempFilePath, sharePoster);  
        
      },
      fail: function(res) {
        console.log(res);
      }
    });
  },

  //画布
  savePoster: function(link, sharePoster) {

    var that = this;

    let promise1 = new Promise(function(resolve, reject) {

      wx.getImageInfo({
        src: link,
        success: function(res) {
          resolve(res);
        },
        fail(err) {
          console.log(err)
        }
      })
    });
    let promise2 = new Promise(function(resolve, reject) {
      wx.getImageInfo({
        src: sharePoster,
        success: function(res) {
          resolve(res);
        }
      })
    });

    Promise.all([
      promise1, promise2
    ]).then(res => {
      /* 图片获取成功 */
      const ctx = wx.createCanvasContext('shareCanvas')

      // 绘制背景图
      var ratio = res[1].width / res[1].height;
      var imgHeight = that.data.windowWidth / ratio;
      that.setData({
        imgWidth: res[1].width,
        imgHeight: res[1].height,

      })

      ctx.drawImage(res[1].path, 0, 0, res[1].width, res[1].height)

      // 绘制二维码
      ctx.drawImage(res[0].path, 744, 1390, that.data.qrcodeWidth, that.data.qrcodeHeight)

      ctx.draw(true, setTimeout(function() {
        wx.canvasToTempFilePath({
          width: res[1].width,
          height: res[1].height,
          destWidth: res[1].width,
          destHeight: res[1].height,
          fileType: 'jpg',
          quality: 1,
          canvasId: 'shareCanvas',
          success: function(res) {
            that.data.tmpPath = res.tempFilePath;
            wx.hideLoading();
            that.saveToBlum(res.tempFilePath);
          },
        })
      }, 1000));
    })
  },





  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // this.canvas();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})