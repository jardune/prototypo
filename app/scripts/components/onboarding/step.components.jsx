import React from 'react';
import OnboardingSlider from './onboarding-slider.components';
import HighlightedText from './highlighted-text.components';

const OnboardingStep = ({
	children,
	title,
	description,
	type,
	fontName,
	sliders,
	letters,
	parameters,
	values,
	onChangeParam,
	className,
}) => (
	<div className={`step ${className}`}>
		{type === 'start' && (
			<img src="assets/images/onboardingIntro.svg" alt="Onboarding - Intro" />
		)}
		<h3>{title}</h3>
		{type === 'finish' && (
			<div
				className="text"
				style={{fontFamily: fontName}}
			>
				<HighlightedText letters="Hamburgefonstiv" />
			</div>
		)}
		<p className="description">{description.map(line => <span>{line}<br /></span>)}</p>
		{(type === 'sliders' || type === 'serifs') && (
			<div
				className="text"
				style={{fontFamily: fontName}}
			>
				<HighlightedText letters={letters} />
			</div>
		)}
		{type === 'finish' && (
			<img className="glyphview" src="assets/images/onboardingFinish.PNG" alt="glyphView - Description" />
		)}
		{(type === 'sliders' || type === 'serifs') && (
			<div className="step-sliders">
				{sliders.map((slider) => {
					const sliderData = parameters.find(p => p.name === slider);

					return (
						sliderData && !sliderData.disabled && (
							<OnboardingSlider
								key={sliderData.name}
								label={sliderData.label}
								min={sliderData.minAdvised}
								max={sliderData.maxAdvised}
								step={sliderData.step}
								value={values[sliderData.name]}
								onChange={onChangeParam}
								name={sliderData.name}
							/>
						)
					);
				})}
			</div>
		)}
		{children}
	</div>
);

export default OnboardingStep;
