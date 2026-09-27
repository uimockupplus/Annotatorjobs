/* =========================================================
   EVALLOOP AI - VOICE TRANSCRIPTION API
   File: /api/transcribe.js

   Browser microphone
        ↓
   WebM audio
        ↓
   This API
        ↓
   Groq Whisper
        ↓
   Transcript text
   ========================================================= */

export default async function handler(req, res) {
  /* =======================================================
     ONLY POST IS ALLOWED
     ======================================================= */

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  /* =======================================================
     CHECK GROQ API KEY
     ======================================================= */

  const groqApiKey =
    process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    console.error(
      "GROQ_API_KEY is not configured."
    );

    return res.status(500).json({
      error:
        "Voice transcription is not configured."
    });
  }

  try {
    /* =====================================================
       CHECK CONTENT TYPE
       ===================================================== */

    const contentType =
      req.headers["content-type"] || "";

    if (
      !contentType.toLowerCase().startsWith(
        "multipart/form-data"
      )
    ) {
      return res.status(400).json({
        error:
          "Audio upload must use multipart/form-data."
      });
    }

    /* =====================================================
       EXTRACT MULTIPART BOUNDARY
       ===================================================== */

    const boundaryMatch =
      contentType.match(
        /boundary=(?:"([^"]+)"|([^;]+))/i
      );

    if (!boundaryMatch) {
      return res.status(400).json({
        error:
          "Multipart boundary is missing."
      });
    }

    const boundary =
      boundaryMatch[1] ||
      boundaryMatch[2];

    /* =====================================================
       READ RAW REQUEST BODY
       ===================================================== */

    const bodyBuffer =
      await readRequestBody(req);

    if (!bodyBuffer || bodyBuffer.length === 0) {
      return res.status(400).json({
        error:
          "No audio data was received."
      });
    }

    /* =====================================================
       PROTECT SERVER FROM VERY LARGE UPLOADS
       ===================================================== */

    const MAX_AUDIO_SIZE =
      25 * 1024 * 1024;

    if (
      bodyBuffer.length >
      MAX_AUDIO_SIZE
    ) {
      return res.status(413).json({
        error:
          "Audio file is too large. Please record a shorter message."
      });
    }

    /* =====================================================
       EXTRACT AUDIO FROM MULTIPART BODY
       ===================================================== */

    const audioPart =
      extractMultipartFile(
        bodyBuffer,
        boundary
      );

    if (!audioPart) {
      return res.status(400).json({
        error:
          "No audio file was found in the upload."
      });
    }

    /* =====================================================
       CREATE FILE FOR GROQ
       ===================================================== */

    const audioBlob =
      new Blob(
        [audioPart.data],
        {
          type:
            audioPart.contentType ||
            "audio/webm"
        }
      );

    /* =====================================================
       SEND AUDIO TO GROQ WHISPER
       ===================================================== */

    const groqForm =
      new FormData();

    groqForm.append(
      "file",
      audioBlob,
      audioPart.filename ||
        "voice.webm"
    );

    /*
     * whisper-large-v3-turbo is the faster,
     * multilingual Groq transcription model.
     */
    groqForm.append(
      "model",
      "whisper-large-v3-turbo"
    );

    /*
     * English is used for the chatbot's normal
     * English voice interaction.
     *
     * If you later want Telugu/Hindi/etc.,
     * we can make this dynamic.
     */
    groqForm.append(
      "language",
      "en"
    );

    groqForm.append(
      "response_format",
      "json"
    );

    groqForm.append(
      "temperature",
      "0"
    );

    const groqResponse =
      await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${groqApiKey}`
          },

          body: groqForm
        }
      );

    const responseText =
      await groqResponse.text();

    let groqData = null;

    try {
      groqData =
        JSON.parse(responseText);
    } catch {
      groqData = null;
    }

    /* =====================================================
       HANDLE GROQ ERROR
       ===================================================== */

    if (!groqResponse.ok) {
      console.error(
        "Groq transcription error:",
        groqResponse.status,
        groqData || responseText
      );

      return res.status(502).json({
        error:
          "Groq voice transcription failed."
      });
    }

    /* =====================================================
       GET TRANSCRIPT
       ===================================================== */

    const transcript =
      String(
        groqData?.text || ""
      ).trim();

    if (!transcript) {
      return res.status(200).json({
        text: "",
        transcript: ""
      });
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    return res.status(200).json({
      text: transcript,
      transcript: transcript
    });

  } catch (error) {
    console.error(
      "Voice transcription server error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to process voice input."
    });
  }
}


/* =========================================================
   READ RAW REQUEST BODY
   ========================================================= */

function readRequestBody(req) {
  return new Promise(
    (resolve, reject) => {
      const chunks = [];

      let totalLength = 0;

      req.on(
        "data",
        (chunk) => {
          const buffer =
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(chunk);

          totalLength +=
            buffer.length;

          /*
           * Stop collecting if the request
           * becomes unreasonably large.
           */
          if (
            totalLength >
            26 * 1024 * 1024
          ) {
            reject(
              new Error(
                "Request body too large."
              )
            );

            return;
          }

          chunks.push(buffer);
        }
      );

      req.on(
        "end",
        () => {
          resolve(
            Buffer.concat(chunks)
          );
        }
      );

      req.on(
        "error",
        (error) => {
          reject(error);
        }
      );
    }
  );
}


/* =========================================================
   EXTRACT MULTIPART FILE
   ========================================================= */

function extractMultipartFile(
  bodyBuffer,
  boundary
) {
  const boundaryBuffer =
    Buffer.from(
      `--${boundary}`
    );

  let searchStart = 0;

  while (true) {
    const partStart =
      bodyBuffer.indexOf(
        boundaryBuffer,
        searchStart
      );

    if (partStart === -1) {
      break;
    }

    const headerStart =
      partStart +
      boundaryBuffer.length;

    /*
     * Find the end of the multipart
     * headers.
     */
    const headerEnd =
      bodyBuffer.indexOf(
        Buffer.from(
          "\r\n\r\n"
        ),
        headerStart
      );

    if (headerEnd === -1) {
      break;
    }

    const headerText =
      bodyBuffer
        .subarray(
          headerStart,
          headerEnd
        )
        .toString("utf8");

    /*
     * We only care about the uploaded
     * audio field.
     */
    if (
      !/name="audio"/i.test(
        headerText
      )
    ) {
      searchStart =
        headerEnd + 4;

      continue;
    }

    /* ===================================================
       GET FILENAME
       =================================================== */

    const filenameMatch =
      headerText.match(
        /filename="([^"]*)"/i
      );

    const filename =
      filenameMatch
        ? filenameMatch[1]
        : "voice.webm";

    /* ===================================================
       GET CONTENT TYPE
       =================================================== */

    const contentTypeMatch =
      headerText.match(
        /Content-Type:\s*([^\r\n]+)/i
      );

    const contentType =
      contentTypeMatch
        ? contentTypeMatch[1].trim()
        : "audio/webm";

    /* ===================================================
       FIND NEXT BOUNDARY
       =================================================== */

    const nextBoundary =
      bodyBuffer.indexOf(
        boundaryBuffer,
        headerEnd + 4
      );

    if (nextBoundary === -1) {
      return null;
    }

    /*
     * Remove the CRLF immediately before
     * the next multipart boundary.
     */
    let dataEnd =
      nextBoundary;

    if (
      bodyBuffer[dataEnd - 2] === 13 &&
      bodyBuffer[dataEnd - 1] === 10
    ) {
      dataEnd -= 2;
    }

    const fileData =
      bodyBuffer.subarray(
        headerEnd + 4,
        dataEnd
      );

    return {
      filename,
      contentType,
      data: fileData
    };
  }

  return null;
}
