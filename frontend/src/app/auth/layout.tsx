export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
  	return (
	  	<main className='flex flex-col items-center rounded-md w-full sm:w-3/5 md:w-2/5 m-auto p-8'>
			<div className='w-full'>
				{children}
			</div>
		</main>
	)
}
