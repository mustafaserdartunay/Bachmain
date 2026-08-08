//
// Bach AI V2 — Realtime / Socket.IO client stub (iOS).
// Platform header: IOS. Rooms: company:{cid}, user:{sub}.
//
// Foreground-only contract:
// - Request mic via AVAudioSession (.playAndRecord) when user enables hands-free.
// - Local wake word while app is active; never claim background listening.
// - On wake → POST /api/ai/realtime/session → WebRTC/WS with ephemeral client_secret.
// - On resignActive / background → tear down session.
// - Siri shortcuts: later phase.
//

import Foundation

enum RealtimeClient {
    static let platform = "IOS"

    /// Metadata-only sync event names (mirror apps/api aiSyncEvents).
    enum SyncEvent {
        static let offerCreated = "offer.created"
        static let offerUpdated = "offer.updated"
        static let orderCreated = "order.created"
        static let aiActionCompleted = "ai.action.completed"
    }

    /// Bach AI Realtime session endpoint (CRM proxy).
    static let realtimeSessionPath = "/api/ai/realtime/session"

    struct SessionRequest: Encodable {
        var complex: Bool = false
        var companyId: String?
        var userId: String?
    }

    /// Placeholder — wire URLSession + WebRTC when native audio bridge lands.
    static func fetchEphemeralSession(
        baseURL: URL,
        body: SessionRequest,
        bearerToken: String?
    ) async throws -> Data {
        var request = URLRequest(url: baseURL.appendingPathComponent(realtimeSessionPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))))
        // Path is absolute on CRM host; prefer composing carefully in AppConfig.
        _ = request
        _ = body
        _ = bearerToken
        throw NSError(
            domain: "BachAI.Realtime",
            code: -1,
            userInfo: [NSLocalizedDescriptionKey: "RealtimeClient not implemented — use web Realtime in WKWebView for V2 MVP."]
        )
    }
}
