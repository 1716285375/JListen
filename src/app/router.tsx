import { useEffect } from 'react';
import { useTranslation, useLanguage } from '../state/language';
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Link, Outlet } from '@tanstack/react-router';
import { ArrowLeft, CircleHelp, Languages } from 'lucide-react';
import { LibraryPage } from '../pages/LibraryPage';
import { AboutPage } from '../pages/AboutPage';
import { loadManifest, loadPaper } from '../content/load';
function Shell() {
  const t=useTranslation();const {language,toggle}=useLanguage();
  useEffect(()=>{document.documentElement.lang=language==='zh'?'zh-CN':'en';},[language]);
  return <><a className="skip-link" href="#main">{t('跳到主要内容')}</a><header className="app-header"><Link to="/" className="brand"><img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="JListen"/><span>JListen<small>{t('日语 · 逐句精听')}</small></span></Link><nav><Link to="/" className="header-library">{t('真题题库')}</Link><button className="header-icon" aria-label={language==='zh'?'Switch to English':'切换为中文'} onClick={toggle}><Languages size={19}/></button><Link to="/about" className="help-link header-icon" aria-label={t('使用说明')}><CircleHelp size={18}/></Link></nav></header><Outlet/></>;
}
export function NotFound() {
  const t=useTranslation();return <main id="main" className="empty-page"><span className="eyebrow">{t('404 · 页面不存在')}</span><h1>{t('这一页走丢了。')}</h1><p>{t('请回到题库，选择一题开始精听。')}</p><Link to="/" className="button button-primary"><ArrowLeft size={16}/>{t('返回题库')}</Link></main>;}
function ContentError({error,reset}:{error:unknown;reset:()=>void}) {
  const t=useTranslation();
  return <main id="main" className="empty-page"><h1>{t('内容暂时无法打开')}</h1><p role="alert">{error instanceof Error ? t(error.message) : t('加载失败，请重试。')}</p><button className="button button-primary" onClick={reset}>{t('重试')}</button><Link to="/">{t('返回题库')}</Link></main>;
}
function PendingContent() {
  const t=useTranslation();
  return <main id="main" className="empty-page" role="status">{t('正在展开题库…')}</main>;
}
const root = createRootRoute({component:Shell,notFoundComponent:NotFound,errorComponent:ContentError});
const index = createRoute({getParentRoute:()=>root,path:'/',loader:loadManifest,component:LibraryPage});
const listen = createRoute({getParentRoute:()=>root,path:'/listen/$paperId/$questionId',loader:({params})=>loadPaper(params.paperId),component:lazyRouteComponent(()=>import('../pages/ListeningPage'),'ListeningPage')});
const about = createRoute({getParentRoute:()=>root,path:'/about',loader:loadManifest,component:AboutPage});
export const router = createRouter({routeTree:root.addChildren([index,listen,about]),defaultPendingComponent:PendingContent,defaultPendingMs:100});
declare module '@tanstack/react-router' {interface Register {router: typeof router;}}
