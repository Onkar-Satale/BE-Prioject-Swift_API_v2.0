import React, { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { getToken } from "../services/authService";
import { showToast } from "../utils/toast";
import "./ContactSupport.css";

const ContactSupport = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const token = getToken();
            if (!token) return;
            try {
                const backendUrl = process.env.REACT_APP_BACKEND_URL;
                const res = await fetch(`${backendUrl}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (res.ok && data.user) {
                    setUserData(data.user);
                }
            } catch (error) {
                console.error("Failed to load user for contact support:", error);
            }
        };
        loadUser();
    }, []);

    const handleFocusName = () => {
        if (!form.name && userData?.username) {
            setForm(prev => ({ ...prev, name: userData.username }));
        }
    };

    const handleFocusEmail = () => {
        if (!form.email && userData?.email) {
            setForm(prev => ({ ...prev, email: userData.email }));
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Replace newlines in message with <br> for HTML formatting
            const formattedMessage = form.message.replace(/\n/g, "<br>");

            await emailjs.send(
                "service_rc05p5v",     // Gmail service
                "template_nh3migb",    // Email template
                {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    subject: form.subject,
                    message: form.message.replace(/\n/g, "<br>"), // preserve line breaks
                },
                "SKmEoaGBdBM-RTXNA"     // Public key
            );

            showToast("☑️ Message sent successfully!");
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });

        } catch (error) {
            console.error("Email send failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="support-page">
            <h1>Contact Support</h1>

            <div className="support-card">
                <form onSubmit={handleSubmit} className="support-form">
                    {/* Name */}
                    <div className="form-group">
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            onFocus={handleFocusName}
                            required
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label>Name</label>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            onFocus={handleFocusEmail}
                            required
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label>Email</label>
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder=" "
                            autoComplete="off"
                        />
                        <label>Phone</label>
                    </div>

                    {/* Subject */}
                    <div className="form-group">
                        <input
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            required
                            placeholder=" "
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <label>Subject</label>
                    </div>

                    {/* Message */}
                    <div className="form-group">
                        <textarea
                            name="message"
                            rows="6"
                            value={form.message}
                            onChange={handleChange}
                            required
                            placeholder=" "
                        />
                        <label>Message</label>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Sending..." : "Submit"}
                    </button>
                </form>
            </div>

        </div>
    );
};

export default ContactSupport;
