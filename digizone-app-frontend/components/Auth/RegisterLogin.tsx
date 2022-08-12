import React, { FC, useRef } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { Users } from '../../services/user.service';
import { useToasts } from 'react-toast-notifications';
import { resposnePayload } from '../../services/api';
import validator from 'validator';
import { setToken } from '../../helper/token-helper';
import Router from 'next/router';
interface IRegisterLoginProps {
	isResgisterForm?: boolean;
}

const initalForm = {
	email: '',
	password: '',
	confirmPassword: '',
	name: '',
};

const RegisterLogin: FC<IRegisterLoginProps> = ({
	isResgisterForm = false,
}) => {
	const { addToast } = useToasts();
	const [authForm, setAuthForm] = React.useState(initalForm);
	const [isLoading, setIsLoading] = React.useState(false);
	const [otpTime, setOtpTime] = React.useState(false);
	const [otpValue, setOtpValue] = React.useState('');

	// handle register form
	const handleRegister = async (e: any) => {
		e.preventDefault();
		try {
			const { email, name, password, confirmPassword } = authForm;
			if (!name) {
				throw new Error('Invalid name');
			}
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			if (password !== confirmPassword) {
				console.error('Invalid password', password, confirmPassword);
				throw new Error('Password does not match');
			}
			if (password.length < 6) {
				throw new Error('Password is too short. Minimum 6 characters');
			}
			setIsLoading(true);
			const payload = {
				email: authForm.email,
				password: authForm.password,
				name: authForm.name,
			};

			const { success, message }: resposnePayload = await Users.registerNewUser(
				payload
			);
			if (!success) throw new Error(message);
			setAuthForm(initalForm);
			setOtpTime(true);
			addToast(message, { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// handle login form
	const handleLogin = async (e: any) => {
		e.preventDefault();
		try {
			const { email, password } = authForm;
			if (!email || !password) {
				throw new Error('Invalid email or password');
			}
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			if (password.length < 6) {
				throw new Error('Password is too short. Minimum 6 characters');
			}
			setIsLoading(true);
			const payload = {
				email: authForm.email,
				password: authForm.password,
			};
			const { success, message, result }: resposnePayload =
				await Users.loginUser(payload);
			if (!success) throw new Error(message);
			setAuthForm(initalForm);
			// set token
			setToken(result.token, result.type);
			addToast(message, { appearance: 'success', autoDismiss: true });
			// redirect to home page
			Router.push('/');
		} catch (error: any) {
			console.log(error);
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// handle resend otp
	const otpResend = async () => {
		try {
			const { email } = authForm;
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			setIsLoading(true);
			const { success, message }: resposnePayload = await Users.resendOTP(
				email
			);
			if (!success) throw new Error(message);
			addToast(message, { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	// verify user otp
	const verifyUser = async (e: any) => {
		e.preventDefault();
		try {
			const { email } = authForm;
			if (!validator.isEmail(email)) {
				throw new Error('Invalid email');
			}
			setIsLoading(true);
			const { success, message }: resposnePayload = await Users.verifyOTP(
				otpValue,
				email
			);
			if (!success) throw new Error(message);
			addToast(message, { appearance: 'success', autoDismiss: true });
			setOtpTime(false);
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	const forgotPassword = async (e: any) => {
		e.preventDefault();
		try {
			const { email } = authForm;
			if (!validator.isEmail(email)) {
				throw new Error(
					'Invalid email. Plese enter a valid email and we will send you a password for you'
				);
			}
			setIsLoading(true);
			const { success, message }: resposnePayload = await Users.forgotUserPassword(
				email
			);
			if (!success) throw new Error(message);
			addToast(message, { appearance: 'success', autoDismiss: true });
		} catch (error: any) {
			if (error.response) {
				return addToast(error.response.data.message, {
					appearance: 'error',
					autoDismiss: true,
				});
			}
			addToast(error.message, { appearance: 'error', autoDismiss: true });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<Card.Header>{isResgisterForm ? 'Register' : 'Login'}</Card.Header>
			<Card.Body>
				<Form>
					{isResgisterForm && (
						<Form.Group className='mb-3'>
							<Form.Label>Full name</Form.Label>
							<Form.Control
								type='text'
								name='name'
								placeholder='Enter your full name'
								disabled={otpTime}
								value={authForm.name || ''}
								onChange={(e) =>
									setAuthForm({ ...authForm, name: e.target.value })
								}
							/>
						</Form.Group>
					)}
					<Form.Group className='mb-3'>
						<Form.Label>Email address</Form.Label>
						<Form.Control
							type='email'
							placeholder='name@example.com'
							name='email'
							disabled={otpTime}
							value={authForm.email || ''}
							onChange={(e) =>
								setAuthForm({ ...authForm, email: e.target.value })
							}
						/>
					</Form.Group>
					<Form.Group className='mb-3'>
						<Form.Label>Password</Form.Label>
						<Form.Control
							type='password'
							name='password'
							placeholder='Enter your password'
							disabled={otpTime}
							value={authForm.password || ''}
							onChange={(e) =>
								setAuthForm({ ...authForm, password: e.target.value })
							}
						/>
					</Form.Group>
					{isResgisterForm && (
						<>
							<Form.Group className='mb-3'>
								<Form.Label>Re-type password</Form.Label>
								<Form.Control
									type='password'
									name='repassword'
									placeholder='Re-type your password'
									disabled={otpTime}
									value={authForm.confirmPassword || ''}
									onChange={(e) =>
										setAuthForm({
											...authForm,
											confirmPassword: e.target.value,
										})
									}
								/>
							</Form.Group>
							{otpTime && (
								<Form.Group className='mb-3'>
									<Form.Label>OTP</Form.Label>
									<Form.Control
										type='text'
										name='otp'
										placeholder='OTP'
										onChange={(e) => setOtpValue(e.target.value)}
									/>

									<Button variant='primary' onClick={otpResend}>
										Resend OTP
									</Button>
								</Form.Group>
							)}
						</>
					)}
					{otpTime ? (
						<Form.Group className='mb-3'>
							<Button
								variant='info'
								type='submit'
								className='btnAuth'
								disabled={isLoading}
								onClick={verifyUser}
							>
								Submit
							</Button>
						</Form.Group>
					) : (
						<Form.Group className='mb-3'>
							<Button
								variant='info'
								type='submit'
								className='btnAuth'
								disabled={isLoading}
								onClick={isResgisterForm ? handleRegister : handleLogin}
							>
								{isResgisterForm ? 'Register' : 'Login'}
							</Button>
						</Form.Group>
					)}
				</Form>
				{!isResgisterForm && (
					<a
						style={{ textDecoration: 'none' }}
						href=''
						onClick={forgotPassword}
					>
						Forgot your password?
					</a>
				)}
			</Card.Body>
		</Card>
	);
};

export default RegisterLogin;
