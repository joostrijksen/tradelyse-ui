'use client'

import Link from 'next/link'

export default function CtraderHelpPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          cTrader integration
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          How to connect the Tradelyse cTrader bot, send your trades to Tradelyse, and
          troubleshoot common issues.
        </p>
      </header>

      {/* Requirements */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          1. Requirements
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Before you start, make sure you have:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-300">
          <li>A Tradelyse account and you are logged in.</li>
          <li>cTrader Desktop installed (Windows app, not the web version).</li>
          <li>
            Your <strong>User ID</strong> and at least one active <strong>API key</strong> from
            the API keys page.
          </li>
        </ul>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href="/api-keys"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-3 py-1.5 font-medium text-emerald-950 hover:bg-emerald-400"
          >
            Go to API keys
          </Link>
          <Link
            href="/trades"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-slate-100 hover:border-emerald-400/70 hover:text-emerald-300"
          >
            Open Trades page
          </Link>
        </div>
      </section>

      {/* Download bot */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          2. Download the Tradelyse cTrader bot
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Download the latest version of the Tradelyse cBot for cTrader:
        </p>

        <div className="mt-3">
          <Link
            href="/downloads/TradelyseLogger.algo"
            className="inline-flex items-center justify-center rounded-lg bg-slate-50 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-slate-200"
          >
            Download Tradelyse cTrader bot (.algo)
          </Link>
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          You don&apos;t need to open this file on your computer. You will import it directly
          inside <strong>cTrader Desktop</strong>.
        </p>
      </section>

      {/* Import in cTrader */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          3. Import the bot in cTrader
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-300">
          <li>Open <strong>cTrader Desktop</strong> on your PC.</li>
          <li>Go to the <strong>Automate</strong> tab (formerly cAlgo).</li>
          <li>
            In the left sidebar under <strong>cBots</strong>, click{' '}
            <strong>Import</strong> or the <strong>+</strong> icon.
          </li>
          <li>
            Select the file <span className="font-mono">TradelyseLogger.algo</span> that you
            downloaded.
          </li>
          <li>
            After import, you should see <strong>TradelyseLogger</strong> (or similar) in your
            list of cBots.
          </li>
        </ol>
      </section>

      {/* Start bot & credentials */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          4. Start the bot and connect it to Tradelyse
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-300">
          <li>
            Open any chart (e.g. EURUSD). The bot will listen to all trades on your trading
            account, not just that symbol.
          </li>
          <li>Attach the <strong>Tradelyse</strong> cBot to this chart.</li>
          <li>Click the <strong>Start</strong> / Play button for the bot.</li>
          <li>
            A settings window will appear. Fill in:
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>
                <strong>User ID</strong> → copy this from the API keys page.
              </li>
              <li>
                <strong>API key</strong> → copy one of your active API keys.
              </li>
            </ul>
          </li>
          <li>Confirm and start the bot.</li>
        </ol>
        <p className="mt-2 text-[11px] text-slate-500">
          The bot does <strong>not</strong> open or close trades. It only listens to your
          account&apos;s activity and sends trade data to your Tradelyse journal.
        </p>
      </section>

      {/* Verify logging */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          5. Verify that trades are received in Tradelyse
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-300">
          <li>Open a small test trade in cTrader (e.g. 0.01 lot).</li>
          <li>Close the trade after a few seconds.</li>
          <li>Go to the <strong>Trades</strong> page in Tradelyse.</li>
          <li>
            Check that you see:
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>The pair (for example EURUSD).</li>
              <li>Direction (long / short).</li>
              <li>Entry and exit price.</li>
              <li>PnL and timestamps.</li>
            </ul>
          </li>
        </ol>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href="/trades"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-medium text-slate-100 hover:border-emerald-400/70 hover:text-emerald-300"
          >
            Open Trades page
          </Link>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-sm font-semibold text-slate-200">
          6. Troubleshooting
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Some common issues and how to solve them:
        </p>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
          <table className="min-w-full text-left text-[11px]">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2">Problem</th>
                <th className="px-3 py-2">Likely cause</th>
                <th className="px-3 py-2">Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              <tr>
                <td className="px-3 py-2">No trades appear in Tradelyse</td>
                <td className="px-3 py-2">
                  Bot is not running, or User ID / API key are empty.
                </td>
                <td className="px-3 py-2">
                  Check that the bot is started in cTrader and that you entered the correct
                  User ID and an active API key.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  401 / unauthorized errors in the bot log
                </td>
                <td className="px-3 py-2">API key is invalid or revoked.</td>
                <td className="px-3 py-2">
                  Create a new API key in Tradelyse, update the bot settings with the new
                  key, and restart the bot.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Trades appear twice</td>
                <td className="px-3 py-2">
                  Multiple Tradelyse bots running on the same account.
                </td>
                <td className="px-3 py-2">
                  Make sure only one instance of the Tradelyse cBot is running per trading
                  account.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  Exit price or close time is missing
                </td>
                <td className="px-3 py-2">
                  Trade is still open or the bot was stopped before the trade closed.
                </td>
                <td className="px-3 py-2">
                  Keep the bot running while trades close. Closed trades will be updated
                  with exit price and close time.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Still stuck? Submit a bug or idea on the{' '}
          <Link
            href="/feedback"
            className="text-emerald-400 hover:text-emerald-300"
          >
            feedback &amp; roadmap
          </Link>{' '}
          page.
        </p>
      </section>
    </div>
  )
}