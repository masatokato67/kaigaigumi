import type { Metadata } from "next";
import BackLink from "@/components/ui/BackLink";

export const metadata: Metadata = {
  title: "お問い合わせ | 海外組サカレポ",
  description: "海外組サカレポへのお問い合わせはこちらから",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackLink href="/" label="トップに戻る" />

      <h1 className="text-3xl font-bold text-white mb-8">お問い合わせ</h1>

      <div className="bg-bg-card rounded-xl p-6 border border-border-dark space-y-6 text-gray-300">
        <section>
          <p className="mb-4">
            海外組サカレポへのお問い合わせは、以下のメールアドレスまでご連絡ください。
          </p>

          <div className="bg-gray-800/50 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">メールアドレス</p>
            <a
              href="mailto:contact@kaigaigumi-football.com"
              className="text-xl text-accent-red hover:underline font-medium"
            >
              contact@kaigaigumi-football.com
            </a>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">お問い合わせの際のお願い</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>件名に「海外組サカレポ」と記載していただけると助かります</li>
            <li>お問い合わせ内容を具体的にご記載ください</li>
            <li>返信までに数日いただく場合があります</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">よくあるお問い合わせ</h2>
          <div className="space-y-4">
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="font-medium text-white mb-2">Q. 掲載情報に誤りがあります</p>
              <p className="text-sm">
                A. 具体的な誤りの内容と正しい情報をお知らせください。確認の上、修正いたします。
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="font-medium text-white mb-2">Q. 新しい選手を追加してほしい</p>
              <p className="text-sm">
                A. 選手名とクラブ名をお知らせください。検討の上、追加を検討いたします。
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <p className="font-medium text-white mb-2">Q. 広告掲載について</p>
              <p className="text-sm">
                A. 広告掲載に関するお問い合わせは、上記メールアドレスまでご連絡ください。
              </p>
            </div>
          </div>
        </section>

        <section className="pt-4 border-t border-border-dark">
          <p className="text-sm text-gray-500">
            ※ 個人情報の取り扱いについては
            <a href="/privacy" className="text-accent-red hover:underline ml-1">
              プライバシーポリシー
            </a>
            をご確認ください。
          </p>
        </section>
      </div>
    </div>
  );
}
