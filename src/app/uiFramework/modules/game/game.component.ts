import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GameService } from '../../../core/game.service';
import { GlobalSettingService, Account } from '../../../global/globalSetting.service'
import { GlobalStatusService } from '../../../global/globalStatus.service'
import { ElMessageService } from 'element-angular'
import * as Rx from 'rxjs/Rx'

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss']
})
export class GameComponent implements AfterViewInit, OnDestroy {
    private gameView = null;
    private zoom = 100;
    private subscriptionList: Rx.Subscription[] = [];
    constructor(
        private gameService: GameService,
        private globalSettingService: GlobalSettingService,
        private globalStatusService: GlobalStatusService,
        private message: ElMessageService,
        private translateService: TranslateService
    ) {
        this.subscriptionList.push(
            this.globalStatusService.GlobalStatusStore.Get('Zoom').Subscribe(v => {
                this.zoom = v;
                if (this.gameView) {
                    if (this.gameView.setZoomFactor === undefined) { return; }
                    this.gameView.setZoomFactor(this.zoom / 100);
                }
            })
        );
    }
    ngAfterViewInit() {
        this.gameView = document.getElementById('gameView');
        this.gameService.WebView = this.gameView;
        let webContent = null;
        const webview = this.gameView;
        webview.addEventListener('dom-ready', () => {
            webContent = webview.getWebContents();
            // webview.openDevTools();
            if ((webview.getURL().indexOf('app_id') !== -1) || webview.getURL().indexOf('/play/') !== -1) {
                // 判断是否为神姬
                webview.send('catch', this.gameService.CurrentGame.Spec);  // 通知页面进行调整
                // gameView注入debugger，所有数据全部发到gameServices里去
                // decipher.attach(webview.getWebContents(), this.$root.eventHub, this.numid); // 注入debuger
            }

            // 自动输入用户名密码
            if (webview.getURL().indexOf('login') !== -1 && webview.getURL().indexOf('logout') === -1) {
                // 从globalSetting中获取账号密码
                const username = this.globalStatusService.GlobalStatusStore.Get('SelectedAccount').Value;
                const account = this.globalSettingService.FindAccount(username);
                if (account) {
                    webview.send('login', { username: account.Username, password: account.Password });
                }
            }
        });
        webview.addEventListener('did-fail-load', (event) => {
            if (event.errorDescription === '' || event.errorDescription === '' || event.isMainFrame === false) { return; }
            this.translateService.get('MESSAGE.PAGE-DIDNOT-LOAD').subscribe(res => this.message['warning'](res));
        })
    }
    ngOnDestroy() {
        for (let i = 0; i < this.subscriptionList.length; i++) {
            this.subscriptionList[i].unsubscribe();
        }
    }
}
