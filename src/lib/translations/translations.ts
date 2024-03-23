import lang from './lang.json';

export default ({
  en: {
    lang,
    menu: {
      darkMode: "Dark Mode",
      backends: "Backends",
      backupRestore: "Backup/Restore"
    },
    main: {
      introduction: "Technologic is a powerful, feature-rich AI Chatbot Client that is designed to work seamlessly with OpenAI's API or any compatible backend. With a user-friendly interface and the ability to organize, modify, and manage your conversations, Technologic brings you a next-level chatting experience with your AI assistant.",
      featuresHeading: "Features",
      features: [
        {
          title: "Secure Storage",
          description: "Your conversations are stored locally on your computer using your browser's IndexedDB storage."
        },
        {
          title: "Backend Compatibility",
          description: "Works with any backend compatible with OpenAI's API."
        },
        {
          title: "Bring Your Own API Key",
          description: "Easily configure your OpenAI API key or any other compatible backend."
        },
        {
          title: "Organize Conversations",
          description: "Keep your conversations tidy by organizing them into folders."
        },
        {
          title: "Message Modification",
          description: "Edit and modify messages, both sent and received, as needed."
        },
        {
          title: "Custom Personality",
          description: "Support for 'System Messages' to give your chatbot a unique personality (if supported by the backend)."
        },
        {
          title: "Fork Conversations",
          description: "Easily branch off into different topics without losing the context of previous conversations."
        },
        {
          title: "Elaborate",
          description: "Use the 'Go on' feature to prompt the bot to expand on its last message."
        },
        {
          title: "Merge Messages",
          description: "Combine messages to avoid fragmentation or incomplete code blocks."
        },
        {
          title: "View Raw Message",
          description: "Access the raw text of any message with the flip of a switch."
        }
      ],
      xpressai: "Technologic was created by <a href='https://www.xpress.ai'>Xpress AI</a>, a company that specializes in developing AI solutions. With a focus on delivering cutting-edge technology that enhances the user experience, Xpress.ai's team of experts developed 'Technologic' to provide a unique and powerful chat client that enables users to have more dynamic and engaging conversations.",
      backendConfigurationWarning: "You must set your OpenAI credentials in the <a href='/settings/backends/OpenAI'>Backend Settings</a> to be able to use that backend.",
      startNewConversation: "Start new Conversation"
    },
    settings: {
      backend: {
        backends: "Backends",
        useModel: "Use Model"
      },
      backup: {
        backupRestore: "Backup/Restore",
        downloadDatabase: "Download Database",
        reloadDatabase: "Reload Database"
      }
    }
  },
  ja: {
    lang,
    menu: {
      darkMode: "表示",
      backends: "バックエンド",
      backupRestore: "バックアップ・リストア"
    },
    main: {
      introduction: "Technologic は、OpenAI の API または互換性のあるバックエンドとシームレスに動作できる機能が豊富な AI チャットボット クライアントです。直感的なUIと会話を整理、変更、管理する機能を備えた Technologic は、AI アシスタントとの次のレベルのチャット 体験を提供します。",
      featuresHeading: "特徴",
      features: [
        {
          title: "安全なデータストレージ",
          description: "ブラウザのIndexedDBを使用しているため、自分のデータがずっとローカルに保存されています。"
        },
        {
          title: "バックエンドの互換性",
          description: "OpenAIのAPIに互換性があれば、使用可能です。"
        },
        {
          title: "自分のAPIキーをそのまま使える",
          description: "OpenAI APIキーまたはその他の互換性のあるバックエンドを簡単に設定できます。"
        },
        {
          title: "チャットを整理する",
          description: "チャットをフォルダ構造に整理することが可能です。"
        },
        {
          title: "メッセージが変更可能",
          description: "必要に応じて、送信メッセージと受信メッセージの両方を編集および変更可能です。"
        },
        {
          title: "チャットの雰囲気をカスタマイズできる",
          description: "チャットボットに独自の個性を与える「システムメッセージ」の対応（バックエンドが対応されている場合のみ）"
        },
        {
          title: "チャットをフォークする",
          description: "以前のチャットのコンテキストを失うことなく、別のテーマに簡単に分岐することができます。"
        },
        {
          title: "更に詳しく説明する",
          description: "「Go on」機能を使用して、チャットの最後のプロンプトを更に詳しく説明させることができます。"
        },
        {
          title: "チャットを結合させる",
          description: "チャットを結合させることにより、メッセージおよびコードの断片化を避けることができます。"
        },
        {
          title: "メッセージの生データを確認できる",
          description: "メッセージの生データをいつでも確認することができます。"
        }
      ],
      xpressai: "Technologic は、AI ソリューションの開発を専門とする会社<a href='https://www.xpress.ai'>Xpress AI</a>が作成されました。 Xpress.ai の専門家チームは、ユーザー エクスペリエンスを向上させる最先端のテクノロジーの提供に重点を置いて、ユーザーがよりダイナミックで魅力的なチャットを可能にするユニークで強力なチャット クライアントを提供する「Technologic」を開発しました。",
      backendConfigurationWarning: "バックエンドを使用できるようにするには、<a href='/settings/backends/OpenAI'>バックエンド設定</a>でOpenAI関連情報を設定する必要があります。",
      startNewConversation: "新しいチャットを開始"
    },
    settings: {
      backend: {
        backends: "バックエンド",
        useModel: "モデル"
      },
      backup: {
        backupRestore: "バックアップ・リストア",
        downloadDatabase: "データベースをダウンロード",
        reloadDatabase: "データベースをリストア"
      }
    }
  }
});
