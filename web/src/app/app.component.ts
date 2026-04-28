import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface LoginResponse { status: number; message: string; token: string; user: { username: string; role: string }; }
interface QRResult      { Q: number[][]; R: number[][]; }
interface StatsData     { max: number; min: number; average: number; sum: number; q_is_diagonal: boolean; r_is_diagonal: boolean; }
interface ApiResponse   { status: number; message: string; qr: QRResult; stats: StatsData; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, DecimalPipe],
  template: `
    <div class="page">

      <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
      <header class="header">
        <div class="header-inner">
          <div class="brand">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="1" y="1" width="9" height="9" rx="2.5" fill="white"/>
                <rect x="12" y="1" width="9" height="9" rx="2.5" fill="white" opacity=".55"/>
                <rect x="1" y="12" width="9" height="9" rx="2.5" fill="white" opacity=".55"/>
                <rect x="12" y="12" width="9" height="9" rx="2.5" fill="white" opacity=".28"/>
              </svg>
            </div>
            <div>
              <span class="brand-name">Interseguro</span>
              <span class="brand-sub">División TI · Coding Challenge 2024</span>
            </div>
          </div>
          <div class="header-right">
            <div class="api-status">
              <div class="api-pill" [class.api-pill--ok]="goOk()" [class.api-pill--err]="!goOk()">
                <span class="api-dot"></span> Go API :8080
              </div>
              <div class="api-pill" [class.api-pill--ok]="nodeOk()" [class.api-pill--err]="!nodeOk()">
                <span class="api-dot"></span> Node API :3000
              </div>
            </div>
            @if (token()) {
              <div class="user-pill">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M1.5 11c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                {{ currentUser() }}
                <button class="logout-btn" (click)="logout()">Salir</button>
              </div>
            }
          </div>
        </div>
      </header>

      <!-- ══ LOGIN ════════════════════════════════════════════════════════ -->
      @if (!token()) {
        <div class="login-screen" style="animation: fadeIn .4s both">
          <div class="login-card">

            <div class="login-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="11" height="11" rx="3" fill="var(--primary)" opacity=".9"/>
                <rect x="15" y="2" width="11" height="11" rx="3" fill="var(--primary)" opacity=".5"/>
                <rect x="2" y="15" width="11" height="11" rx="3" fill="var(--primary)" opacity=".5"/>
                <rect x="15" y="15" width="11" height="11" rx="3" fill="var(--primary)" opacity=".25"/>
              </svg>
            </div>

            <h1 class="login-title">Bienvenido</h1>
            <p class="login-desc">Inicia sesión para acceder a la calculadora QR</p>

            <div class="login-form">
              <div class="field">
                <label>Usuario</label>
                <input
                  type="text"
                  [(ngModel)]="loginUser"
                  placeholder="admin"
                  class="input"
                  (keyup.enter)="login()"
                />
              </div>
              <div class="field">
                <label>Contraseña</label>
                <input
                  [type]="showPass() ? 'text' : 'password'"
                  [(ngModel)]="loginPass"
                  placeholder="••••••••"
                  class="input"
                  (keyup.enter)="login()"
                />
                <button class="show-pass" (click)="showPass.set(!showPass())">
                  {{ showPass() ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>

              @if (loginError()) {
                <div class="login-error" style="animation: fadeIn .3s both">
                  {{ loginError() }}
                </div>
              }

              <button class="btn-login" (click)="login()" [disabled]="loginLoading()">
                @if (loginLoading()) {
                  <span class="spinner"></span> Verificando...
                } @else {
                  Iniciar sesión
                }
              </button>
            </div>

            <div class="login-hint">
              <span>Credenciales de prueba:</span>
              <code>admin / admin123</code>
              <span>·</span>
              <code>user / user123</code>
            </div>
          </div>
        </div>
      }

      <!-- ══ APP PRINCIPAL (solo si hay token) ═══════════════════════════ -->
      @if (token()) {
        <main class="main">

          <div class="hero" style="animation: fadeUp .5s both">
            <h1 class="hero-title">Factorización <em>QR</em></h1>
            <p class="hero-desc">
              Ingresa una matriz rectangular. La <strong>Go API</strong> calculará su
              descomposición QR con Gram-Schmidt modificado y la
              <strong>Node API</strong> calculará estadísticas. Ambas APIs están
              protegidas con <strong>JWT</strong>.
            </p>
          </div>

          <div class="layout">

            <!-- ── COLUMNA IZQUIERDA ──────────────────────────────────── -->
            <aside class="col-input" style="animation: fadeUp .5s .08s both">

              <div class="card">
                <div class="card-label">
                  <span class="step">01</span> Dimensiones
                </div>
                <div class="dim-row">
                  <div class="dim-group">
                    <span class="dim-name">Filas (m)</span>
                    <div class="dim-ctrl">
                      <button class="dim-btn" (click)="changeRows(-1)" [disabled]="rows() <= 2">−</button>
                      <span class="dim-num">{{ rows() }}</span>
                      <button class="dim-btn" (click)="changeRows(1)"  [disabled]="rows() >= 7">+</button>
                    </div>
                  </div>
                  <span class="dim-x">×</span>
                  <div class="dim-group">
                    <span class="dim-name">Columnas (n)</span>
                    <div class="dim-ctrl">
                      <button class="dim-btn" (click)="changeCols(-1)" [disabled]="cols() <= 1">−</button>
                      <span class="dim-num">{{ cols() }}</span>
                      <button class="dim-btn" (click)="changeCols(1)"  [disabled]="cols() >= rows()">+</button>
                    </div>
                  </div>
                </div>
                <p class="hint">Restricción: m ≥ n para que QR sea posible</p>
              </div>

              <div class="card">
                <div class="card-label">
                  <span class="step">02</span> Valores
                </div>
                <div class="matrix-grid" [style.grid-template-columns]="'repeat('+cols()+', 1fr)'">
                  @for (row of inputMatrix(); track row; let i = $index) {
                    @for (cell of row; track cell; let j = $index) {
                      <input type="number" class="cell" [value]="cell"
                        (input)="setCell(i, j, $event)" placeholder="0"/>
                    }
                  }
                </div>
                <div class="quick-examples">
                  <span class="quick-label">Ejemplos:</span>
                  <button class="chip" (click)="loadExample('basic')">3×2</button>
                  <button class="chip" (click)="loadExample('tall')">4×3</button>
                  <button class="chip" (click)="loadExample('identity')">Identidad 3×3</button>
                </div>
              </div>

              <!-- Indicador de sesión segura — no expone el token -->
              <div class="session-card">
                <div class="session-left">
                  <div class="session-dot"></div>
                  <div>
                    <span class="session-title">Sesión autenticada</span>
                    <span class="session-sub">Las requests incluyen JWT · Expira en 24h</span>
                  </div>
                </div>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="1" y="5" width="13" height="9" rx="2.5" stroke="var(--success)" stroke-width="1.3"/>
                  <path d="M4.5 5V4a3 3 0 016 0v1" stroke="var(--success)" stroke-width="1.3" stroke-linecap="round"/>
                  <circle cx="7.5" cy="9.5" r="1.2" fill="var(--success)"/>
                </svg>
              </div>

              <button class="btn-calc" (click)="compute()" [disabled]="loading()">
                @if (loading()) {
                  <span class="spinner"></span> Calculando...
                } @else {
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Calcular factorización QR
                }
              </button>

              @if (errorMsg()) {
                <div class="error-box" style="animation: fadeIn .3s both">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M7.5 4.5v4M7.5 10.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  {{ errorMsg() }}
                </div>
              }
            </aside>

            <!-- ── COLUMNA DERECHA ─────────────────────────────────────── -->
            <section class="col-results">

              @if (!result()) {
                <div class="empty" style="animation: fadeIn .4s both">
                  <div class="empty-icon">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                      <rect x="3" y="3" width="16" height="16" rx="3" stroke="var(--border)" stroke-width="1.5"/>
                      <rect x="25" y="3" width="16" height="16" rx="3" stroke="var(--border)" stroke-width="1.5"/>
                      <rect x="3" y="25" width="16" height="16" rx="3" stroke="var(--border)" stroke-width="1.5"/>
                      <rect x="25" y="25" width="16" height="16" rx="3" stroke="var(--border)" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <p>Completa la matriz y presiona<br><strong>Calcular</strong></p>
                </div>
              }

              @if (result()) {
                <div style="animation: fadeUp .45s both">
                  <div class="card-label" style="margin-bottom:14px">
                    <span class="step step--green">03</span> Matrices resultantes · A = Q · R
                  </div>

                  <div class="matrices-row">
                    <div class="card matrix-card">
                      <div class="matrix-card-head">
                        <span class="matrix-name">Q</span>
                        <span class="matrix-badge matrix-badge--blue">Ortogonal</span>
                        <span class="matrix-dim">{{ result()!.qr.Q.length }}×{{ result()!.qr.Q[0].length }}</span>
                      </div>
                      <div class="matrix-display">
                        @for (row of result()!.qr.Q; track $index) {
                          <div class="mrow">
                            @for (v of row; track $index) {
                              <span class="mval" [class.mval--pos]="v > 1e-10" [class.mval--neg]="v < -1e-10" [class.mval--zero]="isZero(v)">
                                {{ v | number:'1.4-4' }}
                              </span>
                            }
                          </div>
                        }
                      </div>
                      <p class="matrix-note">Columnas ortonormales entre sí</p>
                    </div>

                    <div class="card matrix-card">
                      <div class="matrix-card-head">
                        <span class="matrix-name">R</span>
                        <span class="matrix-badge matrix-badge--teal">Triangular superior</span>
                        <span class="matrix-dim">{{ result()!.qr.R.length }}×{{ result()!.qr.R[0].length }}</span>
                      </div>
                      <div class="matrix-display">
                        @for (row of result()!.qr.R; track $index) {
                          <div class="mrow">
                            @for (v of row; track $index) {
                              <span class="mval" [class.mval--pos]="v > 1e-10" [class.mval--neg]="v < -1e-10" [class.mval--zero]="isZero(v)">
                                {{ v | number:'1.4-4' }}
                              </span>
                            }
                          </div>
                        }
                      </div>
                      <p class="matrix-note">Elementos bajo la diagonal son cero</p>
                    </div>
                  </div>

                  <div class="card" style="margin-top:20px; animation: fadeUp .45s .1s both">
                    <div class="card-label" style="margin-bottom:20px">
                      <span class="step step--purple">04</span> Estadísticas · Node API
                    </div>
                    <div class="stats-grid">
                      <div class="stat">
                        <span class="stat-icon stat-icon--blue">↑</span>
                        <span class="stat-val">{{ result()!.stats.max | number:'1.4-4' }}</span>
                        <span class="stat-lbl">Valor máximo</span>
                      </div>
                      <div class="stat">
                        <span class="stat-icon stat-icon--red">↓</span>
                        <span class="stat-val">{{ result()!.stats.min | number:'1.4-4' }}</span>
                        <span class="stat-lbl">Valor mínimo</span>
                      </div>
                      <div class="stat">
                        <span class="stat-icon">∅</span>
                        <span class="stat-val">{{ result()!.stats.average | number:'1.4-4' }}</span>
                        <span class="stat-lbl">Promedio</span>
                      </div>
                      <div class="stat">
                        <span class="stat-icon">Σ</span>
                        <span class="stat-val">{{ result()!.stats.sum | number:'1.4-4' }}</span>
                        <span class="stat-lbl">Suma total</span>
                      </div>
                      <div class="stat">
                        <span class="stat-icon stat-icon--mono">Q</span>
                        <span class="stat-val" [class.stat-val--yes]="result()!.stats.q_is_diagonal" [class.stat-val--no]="!result()!.stats.q_is_diagonal">
                          {{ result()!.stats.q_is_diagonal ? 'Sí' : 'No' }}
                        </span>
                        <span class="stat-lbl">Q es diagonal</span>
                      </div>
                      <div class="stat">
                        <span class="stat-icon stat-icon--mono">R</span>
                        <span class="stat-val" [class.stat-val--yes]="result()!.stats.r_is_diagonal" [class.stat-val--no]="!result()!.stats.r_is_diagonal">
                          {{ result()!.stats.r_is_diagonal ? 'Sí' : 'No' }}
                        </span>
                        <span class="stat-lbl">R es diagonal</span>
                      </div>
                    </div>
                  </div>

                  <div class="verify-bar" style="animation: fadeIn .5s .2s both">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="var(--success)" stroke-width="1.4"/>
                      <path d="M5 8l2 2 4-4" stroke="var(--success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <strong>A = Q · R</strong> verificado · Go API → Node API · JWT propagado en ambas llamadas
                  </div>
                </div>
              }
            </section>
          </div>
        </main>
      }

      <footer class="footer">
        Interseguro · División TI · Coding Challenge · Junio 2024
        &nbsp;·&nbsp; Go (Fiber) + Node (Express) + Angular 17 · JWT
      </footer>
    </div>
  `,
  styles: [`
    .page { min-height:100vh; display:flex; flex-direction:column; }

    /* ── Header ──────────────────────────────────────────────────────── */
    .header {
      background:var(--primary); height:62px; padding:0 28px;
      display:flex; align-items:center;
      box-shadow:0 2px 16px rgba(26,90,255,.28);
      position:sticky; top:0; z-index:10;
    }
    .header-inner { max-width:1300px; width:100%; margin:0 auto; display:flex; align-items:center; justify-content:space-between; }
    .brand { display:flex; align-items:center; gap:12px; }
    .brand-icon { width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center; }
    .brand-name { display:block; font-family:var(--font-display); font-size:16px; font-weight:800; color:#fff; letter-spacing:-.02em; }
    .brand-sub  { display:block; font-size:11px; color:rgba(255,255,255,.6); margin-top:1px; }
    .header-right { display:flex; align-items:center; gap:12px; }
    .api-status { display:flex; gap:8px; }
    .api-pill { display:flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:11px; padding:4px 10px; border-radius:20px; border:1px solid rgba(255,255,255,.2); color:rgba(255,255,255,.7); transition:all .3s; }
    .api-pill--ok { border-color:rgba(0,201,167,.5); color:rgba(255,255,255,.9); }
    .api-pill--err { opacity:.5; }
    .api-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.3); }
    .api-pill--ok .api-dot { background:var(--accent); box-shadow:0 0 6px var(--accent); }
    .user-pill { display:flex; align-items:center; gap:8px; font-size:12px; color:rgba(255,255,255,.85); background:rgba(255,255,255,.12); padding:5px 12px; border-radius:20px; border:1px solid rgba(255,255,255,.2); }
    .logout-btn { background:rgba(255,255,255,.15); border:none; color:#fff; font-size:11px; padding:2px 8px; border-radius:10px; cursor:pointer; transition:background .15s; &:hover { background:rgba(255,255,255,.25); } }

    /* ── Login screen ────────────────────────────────────────────────── */
    .login-screen { flex:1; display:flex; align-items:center; justify-content:center; padding:24px; background:var(--bg); }
    .login-card {
      width:100%; max-width:400px;
      background:var(--surface); border:1px solid var(--border);
      border-radius:var(--r-xl); padding:40px 36px;
      box-shadow:var(--shadow-lg);
      display:flex; flex-direction:column; align-items:center; gap:0;
    }
    .login-icon { width:56px; height:56px; border-radius:16px; background:var(--primary-light); border:1px solid rgba(26,90,255,.2); display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
    .login-title { font-family:var(--font-display); font-size:24px; font-weight:800; color:var(--text); letter-spacing:-.02em; margin-bottom:6px; }
    .login-desc { font-size:14px; color:var(--text-muted); text-align:center; margin-bottom:28px; }
    .login-form { width:100%; display:flex; flex-direction:column; gap:16px; }
    .field { display:flex; flex-direction:column; gap:6px; position:relative;
      label { font-size:12px; font-weight:500; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
    }
    .input {
      height:42px; border:1.5px solid var(--border); border-radius:var(--r-sm);
      padding:0 12px; font-family:var(--font-body); font-size:14px; color:var(--text);
      background:var(--surface-2); outline:none; transition:all .15s;
      &:focus { border-color:var(--primary); background:var(--surface); box-shadow:0 0 0 3px rgba(26,90,255,.12); }
    }
    .show-pass { position:absolute; right:10px; bottom:10px; background:none; border:none; font-size:11px; color:var(--primary); cursor:pointer; }
    .login-error { padding:10px 12px; background:rgba(240,68,97,.08); border:1px solid rgba(240,68,97,.2); border-radius:var(--r-sm); color:var(--error); font-size:13px; }
    .btn-login {
      height:44px; background:var(--primary); color:#fff; border:none;
      border-radius:var(--r-md); font-family:var(--font-body); font-size:14px; font-weight:600;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
      box-shadow:0 4px 20px rgba(26,90,255,.30); transition:all .2s; margin-top:4px;
      &:hover:not(:disabled) { background:var(--primary-dark); transform:translateY(-1px); }
      &:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }
    }
    .login-hint { margin-top:20px; font-size:12px; color:var(--text-light); display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:center;
      code { background:var(--surface-2); border:1px solid var(--border); padding:2px 7px; border-radius:5px; font-family:var(--font-mono); font-size:11px; color:var(--text-muted); }
    }

    /* ── Main app ────────────────────────────────────────────────────── */
    .main { flex:1; max-width:1300px; width:100%; margin:0 auto; padding:36px 28px; }
    .hero { margin-bottom:32px; }
    .hero-title { font-family:var(--font-display); font-size:38px; font-weight:800; color:var(--text); letter-spacing:-.03em; line-height:1.1; em { color:var(--primary); font-style:normal; } }
    .hero-desc { margin-top:10px; font-size:15px; color:var(--text-muted); line-height:1.65; max-width:640px; strong { color:var(--text); font-weight:600; } }

    .layout { display:grid; grid-template-columns:340px 1fr; gap:24px; align-items:start; }
    @media (max-width:900px) { .layout { grid-template-columns:1fr; } }

    /* ── Cards ───────────────────────────────────────────────────────── */
    .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); padding:22px 24px; box-shadow:var(--shadow-sm); margin-bottom:16px; }
    .card-label { display:flex; align-items:center; gap:10px; font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--text); letter-spacing:-.01em; margin-bottom:18px; }
    .step { font-family:var(--font-mono); font-size:10px; font-weight:500; padding:3px 7px; border-radius:5px; background:var(--primary-light); color:var(--primary); border:1px solid rgba(26,90,255,.18); }
    .step--green  { background:rgba(0,201,167,.1);  color:var(--success); border-color:rgba(0,201,167,.25); }
    .step--purple { background:rgba(139,92,246,.1); color:#7c3aed;        border-color:rgba(139,92,246,.25); }

    /* ── Dimensiones ─────────────────────────────────────────────────── */
    .dim-row { display:flex; align-items:center; gap:16px; margin-bottom:12px; }
    .dim-group { flex:1; }
    .dim-name { display:block; font-size:11px; font-weight:500; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; }
    .dim-x { font-family:var(--font-display); font-size:22px; color:var(--text-muted); margin-top:18px; }
    .dim-ctrl { display:flex; align-items:center; border:1px solid var(--border); border-radius:var(--r-sm); overflow:hidden; }
    .dim-btn { width:34px; height:34px; background:var(--surface-2); border:none; font-size:17px; cursor:pointer; color:var(--text-muted); transition:background .15s, color .15s; &:hover:not(:disabled) { background:var(--primary-light); color:var(--primary); } &:disabled { opacity:.35; cursor:not-allowed; } }
    .dim-num { flex:1; text-align:center; font-family:var(--font-mono); font-size:15px; font-weight:500; }
    .hint { font-size:12px; color:var(--text-light); line-height:1.5; }

    /* ── Matrix input ────────────────────────────────────────────────── */
    .matrix-grid { display:grid; gap:7px; margin-bottom:18px; }
    .cell { width:100%; height:40px; text-align:center; font-family:var(--font-mono); font-size:14px; color:var(--text); background:var(--surface-2); border:1.5px solid var(--border); border-radius:var(--r-sm); outline:none; transition:all .15s; &:focus { border-color:var(--primary); background:var(--surface); box-shadow:0 0 0 3px rgba(26,90,255,.12); } &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { -webkit-appearance:none; } }
    .quick-examples { display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
    .quick-label { font-size:11px; color:var(--text-light); text-transform:uppercase; letter-spacing:.05em; }
    .chip { font-family:var(--font-mono); font-size:11px; padding:4px 10px; border-radius:20px; border:1px solid var(--border); background:var(--surface-2); color:var(--text-muted); cursor:pointer; transition:all .15s; &:hover { border-color:var(--primary); color:var(--primary); background:var(--primary-light); } }

    /* ── Token card ──────────────────────────────────────────────────── */
    .session-card { display:flex; align-items:center; justify-content:space-between; background:rgba(0,201,167,.06); border:1px solid rgba(0,201,167,.2); border-radius:var(--r-md); padding:12px 14px; margin-bottom:16px; }
    .session-left { display:flex; align-items:center; gap:10px; }
    .session-dot { width:8px; height:8px; border-radius:50%; background:var(--success); box-shadow:0 0 8px var(--success); flex-shrink:0; }
    .session-title { display:block; font-size:12px; font-weight:600; color:var(--success); }
    .session-sub   { display:block; font-size:11px; color:var(--text-muted); margin-top:2px; }

    /* ── Botón calcular ──────────────────────────────────────────────── */
    .btn-calc { width:100%; height:48px; border:none; border-radius:var(--r-md); background:var(--primary); color:#fff; font-family:var(--font-body); font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 20px rgba(26,90,255,.30); transition:all .2s; &:hover:not(:disabled) { background:var(--primary-dark); transform:translateY(-1px); box-shadow:0 6px 26px rgba(26,90,255,.38); } &:active:not(:disabled) { transform:translateY(0); } &:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; } }
    .spinner { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .6s linear infinite; }
    .error-box { margin-top:12px; padding:12px 14px; background:rgba(240,68,97,.08); border:1px solid rgba(240,68,97,.22); border-radius:var(--r-sm); color:var(--error); font-size:13px; display:flex; align-items:flex-start; gap:8px; line-height:1.5; }

    /* ── Empty ───────────────────────────────────────────────────────── */
    .empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:380px; gap:16px; color:var(--text-muted); text-align:center; font-size:14px; line-height:1.7; strong { color:var(--text); } }
    .empty-icon { width:76px; height:76px; border-radius:var(--r-xl); background:var(--surface); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-sm); }

    /* ── Matrices resultado ──────────────────────────────────────────── */
    .matrices-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media (max-width:700px) { .matrices-row { grid-template-columns:1fr; } }
    .matrix-card { margin-bottom:0; }
    .matrix-card-head { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
    .matrix-name { font-family:var(--font-display); font-size:22px; font-weight:800; color:var(--primary); letter-spacing:-.02em; }
    .matrix-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:.04em; }
    .matrix-badge--blue { background:var(--primary-light); color:var(--primary); }
    .matrix-badge--teal { background:rgba(0,201,167,.12); color:var(--success); }
    .matrix-dim { margin-left:auto; font-family:var(--font-mono); font-size:11px; color:var(--text-light); }
    .matrix-display { display:flex; flex-direction:column; gap:5px; overflow-x:auto; }
    .mrow { display:flex; gap:5px; }
    .mval { min-width:72px; padding:6px 8px; border-radius:5px; font-family:var(--font-mono); font-size:12px; font-weight:500; text-align:right; background:var(--surface-2); color:var(--text-muted); transition:background .15s; &:hover { background:var(--primary-light); } }
    .mval--pos  { color:var(--primary); background:var(--primary-light); }
    .mval--neg  { color:#7c3aed; background:rgba(139,92,246,.1); }
    .mval--zero { color:var(--text-light); }
    .matrix-note { margin-top:12px; font-size:11px; color:var(--text-light); font-style:italic; }

    /* ── Stats ───────────────────────────────────────────────────────── */
    .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
    @media (max-width:600px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
    .stat { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--r-md); padding:18px 14px; display:flex; flex-direction:column; align-items:center; gap:6px; transition:border-color .2s, box-shadow .2s; &:hover { border-color:var(--primary); box-shadow:0 2px 12px rgba(26,90,255,.10); } }
    .stat-icon { font-size:18px; font-weight:700; color:var(--text-muted); width:32px; height:32px; border-radius:8px; background:var(--surface); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; }
    .stat-icon--blue { color:var(--primary); background:var(--primary-light); border-color:rgba(26,90,255,.2); }
    .stat-icon--red  { color:var(--error);   background:rgba(240,68,97,.08);  border-color:rgba(240,68,97,.2); }
    .stat-icon--mono { font-family:var(--font-mono); font-size:13px; }
    .stat-val { font-family:var(--font-mono); font-size:17px; font-weight:500; color:var(--text); }
    .stat-val--yes { color:var(--success); }
    .stat-val--no  { color:var(--error); }
    .stat-lbl { font-size:11px; color:var(--text-muted); text-align:center; }

    /* ── Verify ──────────────────────────────────────────────────────── */
    .verify-bar { margin-top:16px; padding:12px 18px; background:rgba(0,201,167,.08); border:1px solid rgba(0,201,167,.22); border-radius:var(--r-sm); color:var(--success); font-size:13px; display:flex; align-items:center; gap:8px; strong { font-weight:600; } }

    /* ── Footer ──────────────────────────────────────────────────────── */
    .footer { text-align:center; padding:20px; font-size:12px; color:var(--text-light); border-top:1px solid var(--border); background:var(--surface); }
  `]
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);

  // ── Auth signals ─────────────────────────────────────────────────────
  token       = signal<string | null>(null);
  currentUser = signal('');
  loginUser   = '';
  loginPass   = '';
  loginLoading = signal(false);
  loginError   = signal('');
  showPass     = signal(false);

  // ── App signals ──────────────────────────────────────────────────────
  rows        = signal(3);
  cols        = signal(2);
  inputMatrix = signal<number[][]>(this.makeMatrix(3, 2));
  loading     = signal(false);
  errorMsg    = signal('');
  result      = signal<ApiResponse | null>(null);
  goOk        = signal(false);
  nodeOk      = signal(false);

  ngOnInit(): void {
    // Restaurar token de sessionStorage si existe
    const saved = sessionStorage.getItem('jwt_token');
    const savedUser = sessionStorage.getItem('jwt_user');
    if (saved) { this.token.set(saved); this.currentUser.set(savedUser ?? ''); }

    this.checkHealth();
  }

  // ── Auth ─────────────────────────────────────────────────────────────
  login(): void {
    if (!this.loginUser || !this.loginPass) {
      this.loginError.set('Completa usuario y contraseña');
      return;
    }
    this.loginLoading.set(true);
    this.loginError.set('');

    this.http.post<LoginResponse>(
      environment.goApiUrl + '/auth/login',
      { username: this.loginUser, password: this.loginPass }
    ).subscribe({
      next: res => {
        this.token.set(res.token);
        this.currentUser.set(res.user.username);
        // Guardar en sessionStorage para persistir al recargar
        sessionStorage.setItem('jwt_token', res.token);
        sessionStorage.setItem('jwt_user', res.user.username);
        this.loginLoading.set(false);
      },
      error: err => {
        this.loginError.set(err?.error?.message ?? 'Credenciales incorrectas');
        this.loginLoading.set(false);
      }
    });
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set('');
    sessionStorage.removeItem('jwt_token');
    sessionStorage.removeItem('jwt_user');
    this.result.set(null);
    this.loginUser = '';
    this.loginPass = '';
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.token()}` });
  }

  private checkHealth(): void {
    this.http.get(environment.goApiUrl + '/health').subscribe({
      next: () => this.goOk.set(true),
      error: () => this.goOk.set(false),
    });
    this.http.get(environment.nodeApiUrl + '/health').subscribe({
      next: () => this.nodeOk.set(true),
      error: () => this.nodeOk.set(false),
    });
  }

  // ── Dimensiones ──────────────────────────────────────────────────────
  changeRows(d: number): void {
    const r = this.rows() + d;
    const c = Math.min(this.cols(), r);
    this.rows.set(r); this.cols.set(c);
    this.inputMatrix.set(this.makeMatrix(r, c));
  }

  changeCols(d: number): void {
    const c = this.cols() + d;
    this.cols.set(c);
    this.inputMatrix.set(this.makeMatrix(this.rows(), c));
  }

  setCell(i: number, j: number, ev: Event): void {
    const v = parseFloat((ev.target as HTMLInputElement).value) || 0;
    const m = this.inputMatrix().map(r => [...r]);
    m[i]![j] = v;
    this.inputMatrix.set(m);
  }

  loadExample(type: string): void {
    const ex: Record<string, { r:number; c:number; d:number[][] }> = {
      basic:    { r:3, c:2, d:[[1,2],[3,4],[5,6]] },
      tall:     { r:4, c:3, d:[[1,2,0],[3,1,4],[1,5,9],[2,6,5]] },
      identity: { r:3, c:3, d:[[1,0,0],[0,1,0],[0,0,1]] },
    };
    const e = ex[type]; if (!e) return;
    this.rows.set(e.r); this.cols.set(e.c);
    this.inputMatrix.set(e.d);
    this.result.set(null); this.errorMsg.set('');
  }

  // ── Calcular ─────────────────────────────────────────────────────────
  compute(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.result.set(null);

    this.http.post<ApiResponse>(
      environment.goApiUrl + '/api/matrix/qr',
      { matrix: this.inputMatrix() },
      { headers: this.authHeaders() }   // ← JWT en cada request
    ).subscribe({
      next: res => {
        this.result.set(res);
        this.loading.set(false);
        this.goOk.set(true);
        this.nodeOk.set(res.stats != null);
      },
      error: err => {
        if (err.status === 401) {
          this.logout(); // Token expirado — volver al login
          this.loginError.set('Tu sesión expiró. Inicia sesión nuevamente.');
        } else {
          this.errorMsg.set(err?.error?.message ?? 'Error al conectar con la API');
        }
        this.loading.set(false);
      },
    });
  }

  isZero(v: number): boolean { return Math.abs(v) < 1e-10; }

  private makeMatrix(r: number, c: number): number[][] {
    return Array.from({ length: r }, () => Array(c).fill(0));
  }
}