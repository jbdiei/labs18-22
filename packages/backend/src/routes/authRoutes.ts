import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CredentialsProvider } from "../CredentialsProvider";

/**
 * Payload for JWT authentication tokens.
 */
interface IAuthTokenPayload {
    username: string;
}

/**
 * Generates a JWT for the given username, signed with the provided secret.
 */
function generateAuthToken(username: string, jwtSecret: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const payload: IAuthTokenPayload = { username };
        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: "1d" },
            (error, token) => {
                if (error) reject(error);
                else resolve(token as string);
            }
        );
    });
}

export function registerAuthRoutes(
    app: express.Application,
    credsProv: CredentialsProvider
) {
    // POST /auth/register → register a new user
    app.post(
        "/auth/register",
        express.json(),
        async (req: Request, res: Response) => {
            const { username, password } = req.body;
            // 1) Basic validation
            if (typeof username !== "string" || typeof password !== "string") {
                res.status(400).json({
                    error: "Bad request",
                    message: "Missing username or password",
                });
                return;
            }

            
                // 2) Attempt to register user
                const created = await credsProv.registerUser(username, password);
                if (!created) {
                    res.status(409).json({ error: "Username already taken" });
                    return ;
    }
   // On success: generate and return a token
                try {
                    const token = await generateAuthToken(username, req.app.locals.JWT_SECRET);
                    res.status(201).json({ token });
                    return;
                } catch (err) {
                    console.error("Token creation failed:", err);
                    res.status(500).json({ error: "Internal Server Error" });
                    return;
                }
        }
    );

    // POST /auth/login → verify password and issue JWT
    app.post(
        "/auth/login",
        express.json(),
        async (req: Request, res: Response) => {
            const { username, password } = req.body;
            // 1) Validate input
            if (typeof username !== "string" || typeof password !== "string") {
                res.status(400).json({
                    error: "Bad request",
                    message: "Missing username or password",
                });
                return;
            }

            try {
                // 2) Verify credentials
                const valid = await credsProv.verifyPassword(username, password);
                if (!valid) {
                    res.status(401).json({
                        error: "Unauthorized",
                        message: "Invalid credentials",
                    });
                    return;
                }

                // 3) Generate JWT and respond
                const jwtSecret = req.app.locals.JWT_SECRET as string;
                const token = await generateAuthToken(username, jwtSecret);
                res.json({ token });
                return;
            } catch (err) {
                console.error("Error in /auth/login:", err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "Could not verify password",
                });
                return;
            }
        }
    );
}
