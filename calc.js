// Renewal payment math. Canadian fixed rates compound semi-annually.
(function(root){
const mi=r=>Math.pow(1+r/200,1/6)-1;
function payment(P,i,n){if(n<=0)return 0;if(i===0)return P/n;return P*i/(1-Math.pow(1+i,-n));}
function balanceAfter(P,i,pmt,k){if(i===0)return Math.max(0,P-pmt*k);return Math.max(0,P*Math.pow(1+i,k)-pmt*(Math.pow(1+i,k)-1)/i);}
function shock(o){// loan, origRate, amort (yrs), term (yrs), newRate, income (annual, optional)
 const n=o.amort*12,p0=payment(o.loan,mi(o.origRate),n),b=balanceAfter(o.loan,mi(o.origRate),p0,o.term*12);
 const p1=payment(b,mi(o.newRate),n-o.term*12);const r={oldPmt:p0,balance:b,newPmt:p1,change:p1-p0,pct:(p1/p0-1)*100};
 if(o.income){r.shareOld=p0/(o.income/12)*100;r.shareNew=p1/(o.income/12)*100;}
 // amortization needed to keep the old payment, capped at 40 years remaining
 r.keepPaymentYears=null;for(let m=n-o.term*12;m<=480;m++){if(payment(b,mi(o.newRate),m)<=p0+0.005){r.keepPaymentYears=m/12;break;}}
 return r;}
function curve(o,rates){return rates.map(x=>shock({...o,newRate:x}).pct);}
function band(pct){return pct<5?'low':pct<15?'moderate':pct<30?'high':'severe';}
const api={mi,payment,balanceAfter,shock,curve,band};
if(typeof module!=='undefined')module.exports=api;else root.Calc=api;
})(this);
