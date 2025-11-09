---
title: Gradient Descent
date: 2025-11-10
---

# Gradient Descent

## 내용 / Content
경사 하강법(Gradient Descent)은 최적화 알고리즘으로, 머신러닝 모델의 손실 함수(loss function)를 최소화하기 위해 사용됩니다. 이 방법은 현재의 가중치에서 기울기(gradient)를 계산하여, 해당 방향으로 일정한 비율(learning rate)만큼 가중치를 업데이트합니다. 반복적으로 이 과정을 수행하면서, 모델이 점점 더 나은 성능을 발휘하도록 합니다. 

경사 하강법에는 다양한 변형이 있으며, 가장 대표적인 것 중 하나는 확률적 경사 하강법(Stochastic Gradient Descent, SGD)으로, 매 반복마다 전체 데이터가 아닌 일부 데이터만을 사용하여 가중치를 업데이트합니다. 이는 메모리 효율성을 높이고, 더 빠른 수렴을 가능하게 합니다. 그러나 노이즈가 발생할 수 있어, 적절한 학습률을 설정하는 것이 중요합니다.

## 활용 / Applications
경사 하강법은 대부분의 딥러닝 프레임워크에서 모델 학습의 핵심 방법으로 사용됩니다. 이를 통해 신경망이 빠르게 최적의 가중치를 학습하게 됩니다.

Gradient descent is a core method used for training models in most deep learning frameworks. It allows neural networks to quickly learn optimal weights for improved performance.