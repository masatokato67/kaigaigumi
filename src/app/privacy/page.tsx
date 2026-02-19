import type { Metadata } from "next";
import BackLink from "@/components/ui/BackLink";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 海外組サカレポ",
  description: "海外組サカレポのプライバシーポリシーについて",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackLink href="/" label="トップに戻る" />

      <h1 className="text-3xl font-bold text-white mb-8">プライバシーポリシー</h1>

      <div className="bg-bg-card rounded-xl p-6 border border-border-dark space-y-8 text-gray-300">
        <section>
          <h2 className="text-xl font-bold text-white mb-4">はじめに</h2>
          <p>
            海外組サカレポ（以下「当サイト」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
            本プライバシーポリシーでは、当サイトにおける情報の収集・利用・管理について説明します。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">収集する情報</h2>
          <p className="mb-3">当サイトでは、以下の情報を収集することがあります：</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>アクセス解析のための情報（IPアドレス、ブラウザの種類、アクセス日時、閲覧ページなど）</li>
            <li>お問い合わせフォームから送信される情報（メールアドレス、お問い合わせ内容など）</li>
            <li>Cookieを通じて収集される情報</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Cookieの使用について</h2>
          <p className="mb-3">
            当サイトでは、ユーザー体験の向上およびアクセス解析のためにCookieを使用しています。
            Cookieとは、ウェブサイトがユーザーのブラウザに保存する小さなテキストファイルです。
          </p>
          <p>
            ブラウザの設定により、Cookieの受け入れを拒否することができますが、
            一部の機能が正常に動作しなくなる可能性があります。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">Google Analyticsの使用について</h2>
          <p className="mb-3">
            当サイトでは、アクセス解析のためにGoogle Analyticsを使用しています。
            Google Analyticsは、Cookieを使用してユーザーのサイト利用状況を収集します。
          </p>
          <p className="mb-3">
            収集されたデータは、Googleのプライバシーポリシーに基づいて管理されます。
            Google Analyticsの利用規約およびプライバシーポリシーについては、以下のリンクをご確認ください：
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <a
                href="https://marketingplatform.google.com/about/analytics/terms/jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-red hover:underline"
              >
                Google Analytics利用規約
              </a>
            </li>
            <li>
              <a
                href="https://policies.google.com/privacy?hl=ja"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-red hover:underline"
              >
                Googleプライバシーポリシー
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">広告について</h2>
          <p className="mb-3">
            当サイトでは、第三者配信の広告サービス「Google AdSense」を利用しています。
            広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
          </p>
          <p className="mb-3">
            Google AdSenseでは、ユーザーが過去にアクセスしたウェブサイトの情報に基づいて
            広告を配信する「パーソナライズド広告」が含まれる場合があります。
          </p>
          <p>
            パーソナライズド広告を無効にする場合は、
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-red hover:underline"
            >
              Googleの広告設定
            </a>
            から設定を変更することができます。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">情報の利用目的</h2>
          <p className="mb-3">収集した情報は、以下の目的で利用します：</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>当サイトのサービス提供・運営のため</li>
            <li>ユーザーからのお問い合わせに対応するため</li>
            <li>サイトの利用状況の分析・改善のため</li>
            <li>広告の配信・効果測定のため</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">第三者への情報提供</h2>
          <p>
            当サイトは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            ただし、前述のGoogle Analytics、Google AdSenseなどの外部サービスにおいては、
            各サービスのプライバシーポリシーに従って情報が取り扱われます。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">免責事項</h2>
          <p className="mb-3">
            当サイトに掲載されている情報の正確性には万全を期していますが、
            その内容を保証するものではありません。
          </p>
          <p>
            当サイトの利用により生じたいかなる損害についても、当サイトは責任を負いかねます。
            また、当サイトからリンクされた外部サイトの内容についても、責任を負いかねます。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">著作権について</h2>
          <p>
            当サイトに掲載されているコンテンツ（文章、画像、データなど）の著作権は、
            当サイトまたは各権利者に帰属します。無断での転載・複製はご遠慮ください。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">プライバシーポリシーの変更</h2>
          <p>
            当サイトは、必要に応じて本プライバシーポリシーを変更することがあります。
            変更があった場合は、当ページにて公開します。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">お問い合わせ</h2>
          <p>
            本プライバシーポリシーに関するお問い合わせは、
            <a href="/contact" className="text-accent-red hover:underline">
              お問い合わせページ
            </a>
            よりご連絡ください。
          </p>
        </section>

        <section className="pt-4 border-t border-border-dark">
          <p className="text-sm text-gray-500">
            制定日：2026年2月19日
          </p>
        </section>
      </div>
    </div>
  );
}
