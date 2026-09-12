export type CardIssuerSupport = {
  issuer: string;
  logo: string;
  color: string;
  phone: {
    domestic: string;
    overseas: string;
    overseasAlt?: string;
  };
  onlineReport:
    | {
        type: "WEB";
        url: string;
        buttonLabel: string;
      }
    | {
        type: "APP";
        appName: string;
        appGuide: string;
        buttonLabel: string;
      };
};

export const cardIssuers: readonly CardIssuerSupport[] = [
  {
    issuer: "신한카드",
    logo: "ShinhanCard",
    color: "#2456A6",
    phone: { domestic: "1544-7200", overseas: "+82-2-3420-7000" },
    onlineReport: {
      type: "APP",
      appName: "신한 SOL페이",
      appGuide: "신한 SOL페이 앱 > 하단 금융 탭 > 상단 카드 > 카드 분실신고",
      buttonLabel: "SOL페이에서 신고",
    },
  },
  {
    issuer: "현대카드",
    logo: "Hyundai Card",
    color: "#202632",
    phone: { domestic: "1577-6200", overseas: "+82-2-3015-9200" },
    onlineReport: { type: "WEB", url: "https://mycompany.hyundaicard.com/cs/cl/CSCL1003.do?_method=l", buttonLabel: "온라인 신고" },
  },
  {
    issuer: "삼성카드",
    logo: "Samsung Card",
    color: "#1769D2",
    phone: { domestic: "1588-8900", overseas: "+82-2-2000-8100" },
    onlineReport: { type: "WEB", url: "https://www.samsungcard.com/home/customer/counsel/PGHPPCCCustomerCounselViewConseltInfo001", buttonLabel: "온라인 신고" },
  },
  {
    issuer: "롯데카드",
    logo: "LOTTE CARD",
    color: "#D7193F",
    phone: { domestic: "1588-8300", overseas: "+82-2-1588-8300", overseasAlt: "+82-2-2280-2400" },
    onlineReport: { type: "WEB", url: "https://www.lottecard.co.kr/app/LPMAIAA_V170.lc", buttonLabel: "온라인 신고" },
  },
  {
    issuer: "토스뱅크",
    logo: "toss bank",
    color: "#2864E8",
    phone: { domestic: "1661-7654", overseas: "+82-2-6975-9000" },
    onlineReport: {
      type: "APP",
      appName: "토스",
      appGuide: "토스 앱 > 고객센터 > 카드분실&재발급 > 카드선택",
      buttonLabel: "앱에서 신고",
    },
  },
  {
    issuer: "하나카드",
    logo: "1Q Pay",
    color: "#00A894",
    phone: { domestic: "1599-1133", overseas: "+82-2-1599-1133" },
    onlineReport: { type: "WEB", url: "https://www.hanacard.co.kr/OCY10150300N.web?mID=OCY10150301N&schID=ccd", buttonLabel: "온라인 신고" },
  },
  {
    issuer: "KB국민카드",
    logo: "KB Card",
    color: "#E2A800",
    phone: { domestic: "1588-1788", overseas: "+82-2-6300-7300" },
    onlineReport: { type: "WEB", url: "https://customer.kbcard.com/CXHIAMKC0068.cms", buttonLabel: "온라인 신고" },
  },
  {
    issuer: "우리카드",
    logo: "WON CARD",
    color: "#1677D2",
    phone: { domestic: "1588-5300", overseas: "+82-2-6958-9000" },
    onlineReport: { type: "WEB", url: "https://pc.wooricard.com/dcpc/yh2/bp/bim/bim02/acdrptsvc/H2BIM402S20.do", buttonLabel: "온라인 신고" },
  },
  {
    issuer: "NH농협카드",
    logo: "NH Card",
    color: "#159447",
    phone: { domestic: "1644-4000", overseas: "+82-2-6942-6478" },
    onlineReport: { type: "WEB", url: "https://card.nonghyup.com/servlet/IPCI010201.menu", buttonLabel: "온라인 신고" },
  },
];
